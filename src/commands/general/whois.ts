import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { hasFlag } from '../../util/mod.ts';
import { UserFlag } from '../../enums.ts';
import { getRobloxUsers } from '../../roblox.ts';
import { DiscordApplicationCommandOptionType } from '../../enums.ts';
import { supabase, getServer, getUserByDiscordId } from '../../database.ts';
export default command(({ t, token, guild_id }, { target }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('verify.no_server')));

	const user = await getUserByDiscordId(target.user.id as any);
	if (user) {
		const fields: any[] = [];
		const roles = Object.values(UserFlag).filter(i => typeof i === 'number' && i && hasFlag(user.flags, i)).map(i => `<:voxelified:1128518907486023740> ${t(`common:user_flag.${i}`)}`);
		if (roles.length)
			fields.push({
				name: t('whois.roles'),
				value: roles.join(' • ')
			});

		const robloxLinks = await supabase.from('roblox_links').select('id, target_id').eq('owner', user.id).eq('type', 0).gte('flags', 2);
		if (robloxLinks.data?.length) {
			const users = await getRobloxUsers(robloxLinks.data.map(link => link.target_id));
			const primaryLink = user.primary_roblox_link_id ? robloxLinks.data.find(link => link.id === user.primary_roblox_link_id) ?? robloxLinks.data[0] : robloxLinks.data[0];
			fields.push({
				name: t('whois.roblox'),
				value: users.map(user => t('whois.roblox.user', [user])).join(' • ')
			});

			if (primaryLink) {
				const roblox = users.find(user => user.id === primaryLink.target_id)!;
				fields.push({
					name: t('whois.roblox.sync'),
					value: t('whois.roblox.user', [roblox])
				});
			}
		}

		return editOriginalResponse(token, {
			embeds: [{
				url: `https://www.voxelified.com/user/${user.username}`,
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
		description: 'Select a member to request the Voxelified Profile of.'
	}] as const,
	defaultMemberPermissions: '0'
});