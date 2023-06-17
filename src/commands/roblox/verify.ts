import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { hasFlag } from '../../util/mod.ts';
import { supabase, getServer } from '../../database.ts';
import { modifyMember, getServerRoles } from '../../discord.ts';
import { getRobloxUsers, getRobloxUserRoles } from '../../roblox.ts';
import type { User, TranslateFn, MellowServer, DiscordMember } from '../../types.ts';
import { getUserByDiscordId, getDiscordServerBinds } from '../../database.ts';
import { RobloxLinkFlag, MellowLinkType, DiscordMessageFlag, MellowLinkRequirementType, MellowLinkRequirementsType } from '../../enums.ts';
export default command(({ t, token, locale, member, guild_id }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('verify.no_server')));

	const user = await getUserByDiscordId(member!.user.id as any);
	if (user)
		return verify(t, server, token, guild_id, user, member!);

	console.log('user signup prompt');
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

export async function verify(t: TranslateFn, server: MellowServer, token: string, serverId: string, user: User, member: DiscordMember) {
	console.log(`verifying ${user.name ?? user.username} in ${serverId} as ${member.user.global_name ?? member.user.username}`);
	const binds = await getDiscordServerBinds(serverId);

	let met = 0;
	let roles = member.roles;
	let nickname = member.nick;
	let metRoles: string[] = [];
	let addedRoles: string[] = [];
	let removedRoles: string[] = [];
	let rolesChanged = false;

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
	const { default_nickname } = server;
	if (default_nickname) {
		nickname = default_nickname.replace('{name}', ruser.displayName);
	}
	
	const robloxRoles = binds.some(bind => bind.requirements.some(r => r.type === MellowLinkRequirementType.HasRobloxGroupRole || r.type === MellowLinkRequirementType.HasRobloxGroupRankInRange)) ? await getRobloxUserRoles(userBind.data!.target_id) : [];
	for (const { type, target_ids, requirements, requirements_type } of binds) {
		const requiresOne = requirements_type === MellowLinkRequirementsType.MeetOne;
		if (type === MellowLinkType.Role) {
			let metRequirements = 0;
			for (const item of requirements) {
				if (item.type === MellowLinkRequirementType.HasVerifiedUserLink) {
					const { data, error } = await supabase.from('roblox_links').select('flags').eq('owner', user.id);
					if (error)
						throw error;
					if (data.some(link => hasFlag(link.flags, RobloxLinkFlag.Verified)))
						metRequirements++;
				} else if (item.type === MellowLinkRequirementType.HasRobloxGroupRole) {
					if ([...item.data].splice(1).every(id => robloxRoles.some(role => role.role.id.toString() == id)))
						metRequirements++;
				} else if (item.type === MellowLinkRequirementType.HasRobloxGroupRankInRange) {
					const [group, min, max] = item.data;
					const min2 = parseInt(min), max2 = parseInt(max);
					if (robloxRoles.some(role => role.group.id.toString() === group && role.role.rank >= min2 && role.role.rank <= max2))
						metRequirements++;
				}
				if (requiresOne && metRequirements)
					break;
			}

			if (metRequirements === requirements.length || (requiresOne && metRequirements)) {
				met++;
				metRoles.push(...target_ids);
				if (!target_ids.every(id => member!.roles.includes(id))) {
					const filtered = target_ids.filter(id => !member!.roles.includes(id));
					roles.push(...filtered);
					addedRoles.push(...filtered);
					rolesChanged = true;
				}
			} else {
				const filtered = roles.filter(id => !target_ids.includes(id));
				if (filtered.length !== member!.roles.length) {
					const filtered2 = target_ids.filter(id => roles.includes(id));
					roles = filtered;
					removedRoles.push(...filtered2);
					rolesChanged = true;
				}
			}
		}
	}

	const nickChanged = nickname !== member.nick;
	if (rolesChanged || nickChanged)
		await modifyMember(serverId, member.user.id, {
			nick: nickChanged ? nickname?.slice(0, 32) : undefined,
			roles
		});

	//const dr = metRoles.length ? await getServerRoles(serverId) : [];
	//let rs = metRoles.length ? `\n\nroles you should have:\n${dr.filter(r => metRoles.includes(r.id)).map(r => r.name).join('\n')}` : '';
	const serverRoles = (addedRoles.length + removedRoles.length) ? await getServerRoles(serverId) : [];
	const profileChanged = rolesChanged || nickChanged;
	return editOriginalResponse(token, {
		embeds: profileChanged ? [{
			fields: [
				...rolesChanged ? [{
					name: t('verify.complete.embed.roles'),
					value: `\`\`\`diff\n${[...removedRoles.map(r => '- ' + serverRoles.find(j => j.id === r)?.name), ...addedRoles.map(r => '+ ' + serverRoles.find(j => j.id === r)?.name)].join('\n')}\`\`\``,
					inline: true
				}] : [],
				...nickChanged ? [{
					name: t('verify.complete.embed.nickname'),
					value: `\`\`\`diff\n${nickname ? `${member.nick ? `- ${member.nick}\n` : ''}+ ${nickname}` : `- ${member.nick}`}\`\`\``,
					inline: true
				}] : []
			]
		}] : undefined,
		content: t(`verify.complete.${profileChanged}`) + (rolesChanged ? nickChanged ? t('verify.complete.true.2') : t('verify.complete.true.0') : nickChanged ? t('verify.complete.true.1') : '') + t('verify.profile', [ruser]),
		components: []
	});
}