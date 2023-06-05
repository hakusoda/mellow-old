import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { hasFlag } from '../../util/mod.ts';
import { supabase } from '../../database.ts';
import { modifyMember } from '../../discord.ts';
import { RobloxLinkFlag, MellowBindType, MellowBindRequirementType } from '../../enums.ts';
import { getUserByDiscordId, getDiscordServerBinds } from '../../database.ts';
export default command(async ({ t, token, member, guild_id }) => {
	const user = await getUserByDiscordId(member!.user.id as any);
	if (user) {
		return defer(async () => {
			const binds = await getDiscordServerBinds(guild_id);
			let met = 0;
			let rolesChanged = false;
			for (const { type, target_ids, requirement_type } of binds) {
				if (type === MellowBindType.Role) {
					if (requirement_type === MellowBindRequirementType.HasVerifiedUserLink) {
						const { data, error } = await supabase.from('roblox_links').select('flags').eq('owner', user.id);
						if (error)
							throw error;
						if (data.some(link => hasFlag(link.flags, RobloxLinkFlag.Verified))) {
							met++;
							if (!target_ids.every(id => member!.roles.includes(id))) {
								rolesChanged = true;
								await modifyMember(guild_id, member!.user.id, {
									roles: [...member!.roles, ...target_ids]
								});
							}
						} else {
							const filtered = member!.roles.filter(id => !target_ids.includes(id));
							if (filtered.length !== member!.roles.length) {
								rolesChanged = true;
								await modifyMember(guild_id, member!.user.id, {
									roles: filtered
								});
							}
						}
					}
				}
			}
			return editOriginalResponse(token, content(`you met ${met}/${binds.length} requirements${rolesChanged ? ', and your roles were updated.' : '.'}`));
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
				url: 'https://discord.com/api/oauth2/authorize?client_id=1114438661065412658&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcreate-account%2Fdiscord&response_type=code&scope=identify%20email',
				type: 2,
				style: 5,
				label: 'Continue'
			}, {
				url: 'https://www.voxelified.com',
				type: 2,
				style: 5,
				label: 'Connect Existing'
			}, {
				type: 2,
				style: 2,
				label: 'Cancel',
				custom_id: 'verify_account_required_cancel'
			}]
		}]
	};
});