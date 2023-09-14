import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { sendLogs } from '../../logging.ts';
import { supabase, getServer } from '../../database.ts';
import { syncMember, getRobloxUsers } from '../../roblox.ts';
import { getDiscordServer, getMemberPosition } from '../../discord.ts';
import { DiscordMessageFlag, MellowServerLogType } from '../../enums.ts';
import { getUserByDiscordId, getDiscordServerBinds } from '../../database.ts';
import type { User, TranslateFn, MellowServer, DiscordMember } from '../../types.ts';
export default command(({ t, token, locale, member, guild_id }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('sync.no_server')));

	const user = await getUserByDiscordId(member!.user.id as any);
	if (user)
		return verify(t, null, server, token, guild_id, user, member!);

	supabase.from('mellow_signups').upsert({
		locale,
		user_id: member!.user.id,
		server_id: guild_id,
		interaction_token: token
	}, { onConflict: 'user_id' }).then(({ error }) => {
		if (error)
			console.error(error);
	});
	return editOriginalResponse(token, {
		flags: DiscordMessageFlag.Ephemeral,
		content: t('sync.signup'),
		components: [{
			type: 1,
			components: [{
				url: 'https://discord.com/api/oauth2/authorize?client_id=1068554282481229885&redirect_uri=https%3A%2F%2Fwebsite-dev-tunnel.voxelified.com%2Fcreate-account%2Fdiscord&response_type=code&scope=identify',
				type: 2,
				style: 5,
				label: t('common:action.continue')
			}]
		}]
	});
}, DiscordMessageFlag.Ephemeral));

export async function verify(t: TranslateFn, executor: DiscordMember | null, server: MellowServer, token: string, serverId: string, user: User | undefined, member: DiscordMember, syncAs?: number) {
	const userBind = user ? await supabase.from('users')
		.select('roblox_links!roblox_links_owner_id_fkey ( target_id ), primary:roblox_links!users_primary_roblox_link_id_fkey ( target_id )')
		.eq('id', user.id)
		.eq('roblox_links.type', 0)
		.gte('roblox_links.flags', 2)
		.limit(1)
		.maybeSingle()
		.then(response => {
			if (response.error)
				console.error(response.error);
			return response.data?.primary as any ?? response.data?.roblox_links[0];
		})
	: null;
	if (!userBind && !server.sync_unknown_users)
		return editOriginalResponse(token, {
			content: t('sync.signup'),
			components: [{
				type: 1,
				components: [{
					url: 'https://www.voxelified.com/roblox/authorise',
					type: 2,
					style: 5,
					label: t('common:action.continue')
				}]
			}]
		});

	const robloxId = syncAs ?? userBind?.target_id;
	const [ruser] = robloxId ? await getRobloxUsers([robloxId]) : [undefined];
	const serverLinks = await getDiscordServerBinds(serverId);
	const discordServer = (await getDiscordServer(serverId))!;
	const position = getMemberPosition(discordServer, member);
	const {
		banned,
		kicked,
		addedRoles,
		removedRoles,
		rolesChanged,

		newNickname,
		nicknameChanged
	 } = await syncMember(executor, server, serverLinks, discordServer, user, member, ruser, position);

	const profileChanged = rolesChanged || nicknameChanged;
	if (profileChanged || banned || kicked)
		await sendLogs([[MellowServerLogType.ServerProfileSync, {
			banned,
			kicked,
			member,
			roblox: ruser,
			nickname: [member.nick, newNickname],
			forced_by: executor,
			addedRoles,
			removedRoles
		}]], discordServer.id);

	const removed = banned || kicked;
	return editOriginalResponse(token, {
		embeds: profileChanged ? [{
			fields: [
				...rolesChanged ? [{
					name: t('sync.complete.embed.roles'),
					value: `\`\`\`diff\n${[...removedRoles.map(r => '- ' + r.name), ...addedRoles.map(r => '+ ' + r.name)].join('\n')}\`\`\``,
					inline: true
				}] : [],
				...nicknameChanged ? [{
					name: t('sync.complete.embed.nickname'),
					value: `\`\`\`diff\n${newNickname ? `${member.nick ? `- ${member.nick}\n` : ''}+ ${newNickname}` : `- ${member.nick}`}\`\`\``,
					inline: true
				}] : []
			]
		}] : [],
		content: removed ? t('sync.complete.removed') + t(`sync.complete.removed.${banned ? 0 : 1}`) : t(`sync.complete.${profileChanged}`) + (rolesChanged ? nicknameChanged ? t('sync.complete.true.2') : t('sync.complete.true.0') : nicknameChanged ? t('sync.complete.true.1') : '') + t('sync.profile', [ruser]),
		components: []
	});
}