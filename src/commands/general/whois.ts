import { ROBLOX_API } from '@hakumi/roblox-api';

import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { hasFlag } from '../../util/mod.ts';
import { UserFlag } from '../../enums.ts';
import { DiscordApplicationCommandOptionType } from '../../enums.ts';
import { supabase, getServer, getUserByDiscordId } from '../../database.ts';
export default command(({ t, token, guild_id }, { target }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('sync.no_server')));

	const user = await getUserByDiscordId(target.user.id as any);
	if (user) {
		const fields: any[] = [];
		const roles = Object.values(UserFlag).filter(i => typeof i === 'number' && i && hasFlag(user.flags, i)).map(i => `<:voxelified:1128518907486023740> ${t(`common:user_flag.${i}`)}`);
		if (roles.length)
			fields.push({
				name: t('whois.roles'),
				value: roles.join(' • ')
			});

		const robloxLinks = await supabase.from('mellow_user_server_connections')
			.select<string, {
				connection: { sub: string }
			}>('connection:user_connections ( sub )')
			.eq('user_id', user.id)
			.eq('server_id', guild_id)
			.eq('user_connections.type', 2);
		if (robloxLinks.data) {
			const users = await ROBLOX_API.users.getProfiles(robloxLinks.data.map(i => i.connection.sub), ['names.username', 'names.combinedName']);
			fields.push({
				name: t('whois.roblox'),
				value: users.map(user => t('whois.roblox.user', [user])).join(' • ')
			});
		}

		return editOriginalResponse(token, {
			embeds: [{
				url: `https://hakumi.cafe/user/${user.username}`,
				title: `${user.name ?? user.username} (@${user.username})`,
				fields,
				footer: {
					text: t('whois.joined')
				},
				author: {
					url: `https://discord.com/users/${target.user.id}`,
					name: target.nick ?? target.user.global_name,
					icon_url: `https://cdn.discordapp.com/avatars/${target.user.id}/${target.avatar ?? target.user.avatar}.webp?size=48`
				} as any,
				thumbnail: {
					url: user.avatar_url
				},
				timestamp: user.created_at as any,
				description: user.bio || t('whois.empty_bio')
			}]
		});
	}

	return editOriginalResponse(token, content('user is not real'));
}), {
	options: [{
		name: 'target',
		type: DiscordApplicationCommandOptionType.User,
		required: true,
		description: 'Select a member you wish to view the HAKUMI profile of.'
	}] as const,
	defaultMemberPermissions: '0'
});