import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import type { Log } from '../../types.ts';
import { sendLogs } from '../../logging.ts';
import { DISCORD_APP_ID } from '../../util/constants.ts';
import { supabase, getServer } from '../../database.ts';
import { syncMember, getRobloxUsers } from '../../roblox.ts';
import { DiscordMessageFlag, MellowServerLogType } from '../../enums.ts';
import { getUsersByDiscordId, getDiscordServerBinds } from '../../database.ts';
import { getDiscordServer, getServerMembers, getMemberPosition } from '../../discord.ts';
export default command(({ t, token, member, guild_id }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('sync.no_server')));

	if (!server.allow_forced_syncing)
		return editOriginalResponse(token, content(t('forcesync.disabled', [server])));

	const members = await getServerMembers(guild_id);
	const mellow = members.find(member => member.user.id === DISCORD_APP_ID);
	if (!mellow)
		throw new Error();

	const users = await getUsersByDiscordId(members.map(member => member.user.id));
	const { data: links, error } = await supabase.from('roblox_links').select('owner, target_id').in('owner', users.map(user => user.id)).eq('type', 0).gte('flags', 2);
	if (error)
		throw error;

	const robloxUsers = await getRobloxUsers(links.map(link => link.target_id));

	let synced = 0;
	const serverLinks = await getDiscordServerBinds(guild_id);
	const discordServer = await getDiscordServer(guild_id);
	if (!discordServer)
		throw new Error();

	const syncLogs: Log[] = [];
	const mellowPosition = getMemberPosition(discordServer, mellow);
	for (const target of members) {
		const user = users.find(user => user.sub === target.user.id);
		if (user || server.sync_unknown_users) {
			const userLinks = user ? links.filter(link => link.owner === user.id) : [];
			const robloxUser = robloxUsers.find(user => userLinks.some(link => link.target_id === user.id));
			const {
				addedRoles,
				removedRoles,
				rolesChanged,
		
				newNickname,
				nicknameChanged
			} = await syncMember(member, server, serverLinks, discordServer, user, target, robloxUser, mellowPosition);
			const profileChanged = rolesChanged || nicknameChanged;
			if (profileChanged)
				syncLogs.push([MellowServerLogType.ServerProfileSync, {
					member: target,
					roblox: robloxUser,
					nickname: [target.nick, newNickname],
					addedRoles,
					removedRoles
				}]);
			
			synced++;
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}

	if (syncLogs.length)
		await sendLogs(syncLogs, guild_id);

	const other = members.length - synced;
	return editOriginalResponse(token, content(`${t('forcesyncall.result', [synced])}${other ? t('forcesyncall.result.other', [other]) : ''}`));
}, DiscordMessageFlag.Ephemeral), {
	defaultMemberPermissions: '0'
});