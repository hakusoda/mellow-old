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
		return editOriginalResponse(token, content(t('verify.no_server')));

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
		content: t('verify.signup'),
		components: [{
			type: 1,
			components: [{
				url: 'https://discord.com/api/oauth2/authorize?client_id=1114438661065412658&redirect_uri=https%3A%2F%2Fwww.voxelified.com%2Fcreate-account%2Fdiscord&response_type=code&scope=identify%20email',
				type: 2,
				style: 5,
				label: t('common:action.continue')
			}]
		}]
	});
}, DiscordMessageFlag.Ephemeral));

export async function verify(t: TranslateFn, executor: DiscordMember | null, server: MellowServer, token: string, serverId: string, user: User, member: DiscordMember) {
	const userBind = await supabase.from('roblox_links').select('target_id').eq('owner', user.id).eq('type', 0).gte('flags', 2).limit(1).maybeSingle();
	if (!userBind.data)
		return editOriginalResponse(token, {
			content: t('verify.signup'),
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

	const [ruser] = await getRobloxUsers([userBind.data.target_id]);
	const serverLinks = await getDiscordServerBinds(serverId);
	const discordServer = (await getDiscordServer(serverId))!;
	const position = getMemberPosition(discordServer, member);
	const [
		rolesChanged,
		addedRoles,
		removedRoles,
		nickChanged,
		newNickname
	] = await syncMember(null, server, serverLinks, discordServer, user, member, ruser, position);

	const profileChanged = rolesChanged || nickChanged;
	if (profileChanged)
		await sendLogs([[MellowServerLogType.ServerProfileSync, {
			member,
			roblox: ruser,
			nickname: [member.nick, newNickname],
			addedRoles,
			removedRoles
		}]], discordServer.id);

	return editOriginalResponse(token, {
		embeds: profileChanged ? [{
			fields: [
				...rolesChanged ? [{
					name: t('verify.complete.embed.roles'),
					value: `\`\`\`diff\n${[...removedRoles.map(r => '- ' + r.name), ...addedRoles.map(r => '+ ' + r.name)].join('\n')}\`\`\``,
					inline: true
				}] : [],
				...nickChanged ? [{
					name: t('verify.complete.embed.nickname'),
					value: `\`\`\`diff\n${newNickname ? `${member.nick ? `- ${member.nick}\n` : ''}+ ${newNickname}` : `- ${member.nick}`}\`\`\``,
					inline: true
				}] : []
			]
		}] : undefined,
		content: t(`verify.complete.${profileChanged}`) + (rolesChanged ? nickChanged ? t('verify.complete.true.2') : t('verify.complete.true.0') : nickChanged ? t('verify.complete.true.1') : '') + t('verify.profile', [ruser]),
		components: []
	});
}