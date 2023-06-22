import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { DISCORD_APP_ID } from '../../util/constants.ts';
import { DiscordMessageFlag } from '../../enums.ts';
import { supabase, getServer } from '../../database.ts';
import { syncMember, getRobloxUsers } from '../../roblox.ts';
import { getUsersByDiscordId, getDiscordServerBinds } from '../../database.ts';
import { getDiscordServer, getServerMembers, getMemberPosition } from '../../discord.ts';
export default command(({ t, token, member, guild_id }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('verify.no_server')));

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

	const mellowPosition = getMemberPosition(discordServer, mellow);
	for (const user of users) {
		const target = members.find(member => user.mellow_ids.includes(member.user.id));
		if (target) {
			const userLinks = links.filter(link => link.owner === user.id);
			const robloxUser = robloxUsers.find(user => userLinks.some(link => link.target_id === user.id));
			if (robloxUser) {
				await syncMember(member, server, serverLinks, discordServer, user, target, robloxUser, mellowPosition);
				synced++;
			}
		}
	}

	return editOriginalResponse(token, content(`successfully synced ${synced}/${members.length} server profiles`));
}, DiscordMessageFlag.Ephemeral), {
	defaultMemberPermissions: '0'
});