import { hasFlag } from './util/mod.ts';
import { supabase } from './database.ts';
import { modifyMember, getMemberPosition } from './discord.ts';
import { RobloxLinkFlag, MellowLinkType, MellowLinkRequirementType, MellowLinkRequirementsType } from './enums.ts';
import type { User, MellowBind, DiscordRole, MellowServer, DiscordGuild, DiscordMember, PartialRobloxUser, RobloxUsersResponse, RobloxUserRolesResponse } from './types.ts';
export function getRobloxUsers(userIds: (string | number)[]) {
	return fetch(`https://users.roblox.com/v1/users`, {
		body: JSON.stringify({
			userIds,
			excludeBannedUsers: false
		}),
		method: 'POST'
	})
		.then(response => response.json())
		.then(data => (data as RobloxUsersResponse).data);
}

export function getRobloxUserRoles(userId: string | number) {
	return fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`)
		.then(response => response.json())
		.then(data => (data as RobloxUserRolesResponse).data);
}

export async function syncMember(executor: DiscordMember | null, server: MellowServer, serverLinks: MellowBind[], discordServer: DiscordGuild, user: User, member: DiscordMember, robloxUser: PartialRobloxUser, mellowPosition: number): Promise<[boolean, DiscordRole[], DiscordRole[], boolean, string | null]> {
	let roles = [...member.roles];
	let nickname = member.nick;
	let rolesChanged = false;

	const position = getMemberPosition(discordServer, member);
	const addedRoles: DiscordRole[] = [];
	const removedRoles: DiscordRole[] = [];

	const { default_nickname } = server;
	if (default_nickname)
		nickname = default_nickname.replace('{name}', robloxUser.displayName);

	const robloxRoles = serverLinks.some(bind => bind.requirements.some(r => r.type === MellowLinkRequirementType.HasRobloxGroupRole || r.type === MellowLinkRequirementType.HasRobloxGroupRankInRange)) ? await getRobloxUserRoles(robloxUser.id) : [];
	for (const { type, target_ids, requirements, requirements_type } of serverLinks) {
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
				} else if (item.type === MellowLinkRequirementType.InRobloxGroup)
					if (robloxRoles.some(role => role.group.id.toString() === item.data[0]))
						metRequirements++;
				if (requiresOne && metRequirements)
					break;
			}

			if (metRequirements === requirements.length || (requiresOne && metRequirements)) {
				if (!target_ids.every(id => member!.roles.includes(id))) {
					const filtered = target_ids.filter(id => !member!.roles.includes(id));
					roles.push(...filtered);
					addedRoles.push(...filtered.map(r => discordServer.roles.find(j => j.id === r)!));
					rolesChanged = true;
				}
			} else {
				const filtered = roles.filter(id => !target_ids.includes(id));
				if (!roles.every(id => filtered.includes(id))) {
					const filtered2 = target_ids.filter(id => roles.includes(id));
					roles = filtered;
					removedRoles.push(...filtered2.map(r => discordServer.roles.find(j => j.id === r)!));
					rolesChanged = true;
				}
			}
		}
	}

	const nickChanged = position <= mellowPosition && member.user.id !== discordServer.owner_id && nickname !== member.nick;
	if (rolesChanged || nickChanged)
		await modifyMember(server.id, member.user.id, {
			nick: nickChanged ? nickname?.slice(0, 32) : undefined,
			roles
		}, executor ? `Forcefully synced by ${executor.user.global_name} (@${executor.user.username})` : 'Roblox Server Profile Sync');
	
	return [rolesChanged, addedRoles, removedRoles, nickChanged, nickname];
}