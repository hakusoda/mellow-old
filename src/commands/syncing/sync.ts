import { ROBLOX_API } from '@hakumi/roblox-api';

import { command } from '../mod.ts';
import { sendLogs } from '../../logging.ts';
import { syncMember } from '../../roblox.ts';
import { defer, content } from '../response.ts';
import { sendSyncedWebhookEvent } from '../../syncing.ts';
import { MELLOW_SYNC_REQUIREMENT_CONNECTIONS } from '../../constants.ts';
import { getDiscordServer, getMemberPosition, editOriginalResponse } from '../../discord.ts';
import type { User, TranslateFn, MellowServer, DiscordMember, RobloxProfile } from '../../types.ts';
import { supabase, getServer, getUserByDiscordId, getServerProfileSyncingActions } from '../../database.ts';
import { RoleChangeType, UserConnectionType, DiscordMessageFlag, MellowServerLogType, WebhookSyncedEventItemState } from '../../enums.ts';
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
		content: t('sync.signup', ['TODO', guild_id])
	});
}, DiscordMessageFlag.Ephemeral));

export async function verify(t: TranslateFn, executor: DiscordMember | null, server: MellowServer, token: string, serverId: string, user: User | undefined, member: DiscordMember) {
	const userConnections = user ? await supabase.from('users')
		.select<string, {
			connections: {
				connection: {
					sub: string
					type: UserConnectionType
				}
			}[]
		}>('connections:mellow_user_server_connections ( connection:user_connections ( sub, type ) )')
		.eq('id', user.id)
		.limit(1)
		.maybeSingle()
		.then(response => {
			if (response.error)
				console.error(response.error);
			if (!response.data)
				return [];
			return response.data?.connections.map(item => item.connection);
		})
	: [];

	const robloxId = userConnections?.find(item => item.type === UserConnectionType.Roblox)?.sub;
	const [ruser]: RobloxProfile[] = robloxId ? await ROBLOX_API.users.getProfiles([robloxId], ['names.username', 'names.combinedName']) : [undefined];
	const serverLinks = await getServerProfileSyncingActions(serverId);
	const discordServer = (await getDiscordServer(serverId))!;
	const position = getMemberPosition(discordServer, member);
	const {
		banned,
		kicked,
		roleChanges,

		newNickname,
		nicknameChanged
	 } = await syncMember(executor, server, serverLinks, discordServer, user, member, ruser, position);

	const profileChanged = !!roleChanges.length || nicknameChanged;
	if (profileChanged || banned || kicked) {
		await sendLogs([[MellowServerLogType.ServerProfileSync, {
			banned,
			kicked,
			member,
			nickname: [member.nick, newNickname],
			forced_by: executor,
			role_changes: roleChanges
		}]], discordServer.id);
		await sendSyncedWebhookEvent(server, [{
			state: banned ? WebhookSyncedEventItemState.BannedFromServer : kicked ? WebhookSyncedEventItemState.KickedFromServer : WebhookSyncedEventItemState.None,
			forced_by: executor ? { id: executor.user.id } : undefined,
			role_changes: roleChanges,
			discord_member_id: member.user.id,
			discord_server_id: serverId,
			relevant_user_connections: userConnections
		}]);
	}

	const removed = banned || kicked;
	const addedRoles = roleChanges.filter(item => item.type === RoleChangeType.Added);
	const removedRoles = roleChanges.filter(item => item.type === RoleChangeType.Removed);

	const actionConnections = [...new Set(serverLinks.map(item => item.requirements.map(item => MELLOW_SYNC_REQUIREMENT_CONNECTIONS[item.type]!).filter(i => i)).flat())];
	return editOriginalResponse(token, {
		embeds: profileChanged ? [{
			fields: [
				...roleChanges.length ? [{
					name: t('sync.complete.embed.roles'),
					value: `\`\`\`diff\n${[...removedRoles.map(r => '- ' + r.display_name), ...addedRoles.map(r => '+ ' + r.display_name)].join('\n')}\`\`\``,
					inline: true
				}] : [],
				...nicknameChanged ? [{
					name: t('sync.complete.embed.nickname'),
					value: `\`\`\`diff\n${newNickname ? `${member.nick ? `- ${member.nick}\n` : ''}+ ${newNickname}` : `- ${member.nick}`}\`\`\``,
					inline: true
				}] : []
			]
		}] : [],
		content: removed ? t('sync.complete.removed') + t(`sync.complete.removed.${banned ? 0 : 1}`) : t(`sync.complete.${profileChanged}`) + (roleChanges.length ? nicknameChanged ? t('sync.complete.true.2') : t('sync.complete.true.0') : nicknameChanged ? t('sync.complete.true.1') : '') + (userConnections.length >= actionConnections.length ? '' : t('sync.complete.missing_connections', [serverId])),
		components: []
	});
}