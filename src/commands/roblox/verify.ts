import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { hasFlag } from '../../util/mod.ts';
import { supabase } from '../../database.ts';
import { getRobloxUserRoles } from '../../roblox.ts';
import { modifyMember, getServerRoles } from '../../discord.ts';
import type { User, TranslateFn, DiscordMember } from '../../types.ts';
import { getUserByDiscordId, getDiscordServerBinds } from '../../database.ts';
import { RobloxLinkFlag, MellowLinkType, DiscordMessageFlag, MellowLinkRequirementType, MellowLinkRequirementsType } from '../../enums.ts';
export default command(async ({ t, token, locale, member, guild_id }) => {
	const user = await getUserByDiscordId(member!.user.id as any);
	if (user)
		return defer(token, () => verify(t, token, guild_id, user, member!), DiscordMessageFlag.Ephemeral);

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
	return {
		flags: DiscordMessageFlag.Ephemeral,
		content: t('verify.signup'),
		components: [{
			type: 1,
			components: [{
				url: 'https://discord.com/api/oauth2/authorize?client_id=1114438661065412658&redirect_uri=https%3A%2F%2Fwww.voxelified.com%2Fcreate-account%2Fdiscord&response_type=code&scope=identify%20email',
				type: 2,
				style: 5,
				label: t('common:action.continue')
			}/*, {
				url: 'https://www.voxelified.com',
				type: 2,
				style: 5,
				label: 'Connect Existing'
			}*/, {
				type: 2,
				style: 2,
				label: t('common:action.cancel'),
				disabled: true,
				custom_id: 'verify_account_required_cancel'
			}]
		}]
	};
});

export async function verify(t: TranslateFn, token: string, serverId: string, user: User, member: DiscordMember) {
	console.log(`verifying ${user.name ?? user.username} in ${serverId} as ${member.user.global_name ?? member.user.username}`);
	const binds = await getDiscordServerBinds(serverId);

	let met = 0;
	let roles = member.roles;
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

	if (rolesChanged)
		await modifyMember(serverId, member.user.id, { roles });

	//const dr = metRoles.length ? await getServerRoles(serverId) : [];
	//let rs = metRoles.length ? `\n\nroles you should have:\n${dr.filter(r => metRoles.includes(r.id)).map(r => r.name).join('\n')}` : '';
	return editOriginalResponse(token, {
		content: t(`verify.complete.${rolesChanged}`),
		components: []
	});
}