import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { hasFlag } from '../../util/mod.ts';
import { supabase } from '../../database.ts';
import { getRobloxUserRoles } from '../../roblox.ts';
import { modifyMember, getServerRoles } from '../../discord.ts';
import { RobloxLinkFlag, MellowBindType, MellowBindRequirementType } from '../../enums.ts';
import { getUserByDiscordId, getDiscordServerBinds } from '../../database.ts';
export default command(async ({ t, token, member, guild_id }) => {
	const user = await getUserByDiscordId(member!.user.id as any);
	if (user) {
		return defer(token, async () => {
			const binds = await getDiscordServerBinds(guild_id);
			console.log(binds);
			let met = 0;
			let roles = member!.roles;
			let metRoles: string[] = [];
			let rolesChanged = false;

			const userBind = await supabase.from('roblox_links').select('target_id').eq('owner', user.id).eq('type', 0).gte('flags', 2).limit(1).single();
			console.log(userBind);
			
			const robloxRoles = binds.some(bind => bind.requirements.some(r => r.type === MellowBindRequirementType.HasRobloxGroupRole)) ? await getRobloxUserRoles(userBind.data!.target_id) : [];
			console.log(robloxRoles);
			for (const { type, target_ids, requirements } of binds) {
				if (type === MellowBindType.Role) {
					let metRequirements = 0;
					for (const item of requirements) {
						if (item.type === MellowBindRequirementType.HasVerifiedUserLink) {
							const { data, error } = await supabase.from('roblox_links').select('flags').eq('owner', user.id);
							if (error)
								throw error;
							if (data.some(link => hasFlag(link.flags, RobloxLinkFlag.Verified)))
								metRequirements++;
						} else if (item.type === MellowBindRequirementType.HasRobloxGroupRole) {
							if (item.data.every(id => robloxRoles.some(role => role.role.id.toString() == id)))
								metRequirements++;
						}
					}

					if (metRequirements === requirements.length) {
						met++;
						metRoles.push(...target_ids);
						if (!target_ids.every(id => member!.roles.includes(id))) {
							roles.push(...target_ids.filter(id => !member!.roles.includes(id)));
							rolesChanged = true;
						}
					} else {
						const filtered = roles.filter(id => !target_ids.includes(id));
						if (filtered.length !== member!.roles.length) {
							roles = filtered;
							rolesChanged = true;
						}
					}
				}
			}

			if (rolesChanged)
				await modifyMember(guild_id, member!.user.id, { roles });

			const dr = metRoles.length ? await getServerRoles(guild_id) : [];
			let rs = metRoles.length ? `\n\nroles you should have:\n${dr.filter(r => metRoles.includes(r.id)).map(r => r.name).join('\n')}` : '';
			return editOriginalResponse(token, content(`you met the requirements of ${met}/${binds.length} bindings${rolesChanged ? ', and your roles were updated.' : '.'}${rs}`));
		});
	}

	supabase.from('mellow_signups').upsert({
		user_id: member!.user.id,
		interaction_token: token
	}, {
		onConflict: 'user_id'
	}).then(({ error }) => {
		if (error)
			console.error(error);
	});
	return {
		flags: 1 << 6,
		content: '## account required\nBy clicking continue, a Voxelified account will be created for you.\nYour profile will be based off your discord profile, but can be changed later.\nthis message is unfinished...',
		components: [{
			type: 1,
			components: [{
				url: 'https://discord.com/api/oauth2/authorize?client_id=1114438661065412658&redirect_uri=https%3A%2F%2Fwww.voxelified.com%2Fcreate-account%2Fdiscord&response_type=code&scope=identify%20email',
				type: 2,
				style: 5,
				label: 'Continue'
			}/*, {
				url: 'https://www.voxelified.com',
				type: 2,
				style: 5,
				label: 'Connect Existing'
			}*/, {
				type: 2,
				style: 2,
				label: 'Cancel',
				custom_id: 'verify_account_required_cancel'
			}]
		}]
	};
});