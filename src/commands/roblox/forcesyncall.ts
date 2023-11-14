import { ROBLOX_API } from '@hakumi/roblox-api';

import { command } from '../mod.ts';
import { sendLogs } from '../../logging.ts';
import { syncMember } from '../../roblox.ts';
import { defer, content } from '../response.ts';
import { DISCORD_APP_ID } from '../../util/constants.ts';
import { sendSyncedWebhookEvent } from '../../syncing.ts';
import type { Log, RobloxProfile, WebhookSyncedEventItem } from '../../types.ts';
import { DiscordMessageFlag, MellowServerLogType, WebhookSyncedEventItemState } from '../../enums.ts';
import { supabase, getServer, getUsersByDiscordId, getServerProfileSyncingActions } from '../../database.ts';
import { getDiscordServer, getServerMembers, getMemberPosition, editOriginalResponse } from '../../discord.ts';
export default command(({ t, token, member, guild_id }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('sync.no_server')));

	if (!server.allow_forced_syncing)
		return editOriginalResponse(token, content(t('forcesync.disabled', [server])));

	const discordServer = await getDiscordServer(guild_id);
	if (!discordServer)
		throw new Error();

	if (discordServer.approximate_member_count! > 99)
		return editOriginalResponse(token, content(t('forcesyncall.server_too_big')));

	const members = await getServerMembers(guild_id);
	const mellow = members.find(member => member.user.id === DISCORD_APP_ID);
	if (!mellow)
		throw new Error();

	const users = await getUsersByDiscordId(members.map(member => member.user.id));
	const links = await supabase.from('users')
		.select('user_connections ( sub, type, user_id )')
		.in('id', users.map(user => user.id))
		.eq('user_connections.type', 2)
		.then(response => {
			if (response.error)
				console.error(response.error);
			return response.data?.map(item => item.user_connections[0]).filter(i => i) ?? [];
		});

	const robloxUsers: RobloxProfile[] = await ROBLOX_API.users.getProfiles(links.map(link => link.sub as string), ['names.username', 'names.combinedName']);

	let synced = 0;
	const serverLinks = await getServerProfileSyncingActions(guild_id);

	const syncLogs: Log[] = [];
	const webhookEventItems: WebhookSyncedEventItem[] = [];
	const mellowPosition = getMemberPosition(discordServer, mellow);
	for (const target of members) {
		const user = users.find(user => user.sub === target.user.id);
		const userLinks = user ? links.filter(link => link.user_id === user.id) : [];
		const robloxUser = robloxUsers.find(user => userLinks.some(link => link.sub === user.userId.toString()));
		const {
			banned,
			kicked,
			roleChanges,
	
			newNickname,
			nicknameChanged
		} = await syncMember(member, server, serverLinks, discordServer, user, target, robloxUser, mellowPosition);
		const profileChanged = roleChanges.length || nicknameChanged;
		if (profileChanged || banned || kicked) {
			syncLogs.push([MellowServerLogType.ServerProfileSync, {
				banned,
				kicked,
				member: target,
				nickname: [target.nick, newNickname],
				forced_by: member,
				role_changes: roleChanges
			}]);
			webhookEventItems.push({
				state: banned ? WebhookSyncedEventItemState.BannedFromServer : kicked ? WebhookSyncedEventItemState.KickedFromServer : WebhookSyncedEventItemState.None,
				forced_by: { id: member!.user.id },
				role_changes: roleChanges,
				discord_member_id: target.user.id,
				discord_server_id: guild_id,
				relevant_user_connections: links.filter(item => item.user_id == target.user.id).map(item => ({
					sub: item.sub,
					type: item.type
				}))
			});

			await new Promise(resolve => setTimeout(resolve, 500));
		}
		
		synced++;
	}

	if (syncLogs.length)
		await sendLogs(syncLogs, guild_id);
	await sendSyncedWebhookEvent(server, webhookEventItems);

	const other = members.length - synced;
	return editOriginalResponse(token, content(`${t('forcesyncall.result', [synced])}${other ? t('forcesyncall.result.other', [other]) : ''}`));
}, DiscordMessageFlag.Ephemeral), {
	defaultMemberPermissions: '0'
});