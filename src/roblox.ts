import { banMember, kickMember, modifyMember, getMemberPosition } from './discord.ts';
import { MellowLinkRequirementType, MellowLinkRequirementsType, MellowServerProfileActionType } from './enums.ts';
import type { User, MellowBind, DiscordRole, MellowServer, DiscordGuild, DiscordMember, PartialRobloxUser, RobloxUsersResponse, RobloxUserRolesResponse, RobloxServerProfileSyncResult } from './types.ts';
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

export async function syncMember(executor: DiscordMember | null, server: MellowServer, serverLinks: MellowBind[], discordServer: DiscordGuild, user: User | undefined, member: DiscordMember, robloxUser: PartialRobloxUser | undefined, mellowPosition: number): Promise<RobloxServerProfileSyncResult> {
	let roles = [...member.roles];
	let nickname = member.nick;
	let rolesChanged = false;

	const position = getMemberPosition(discordServer, member);
	const addedRoles: DiscordRole[] = [];
	const removedRoles: DiscordRole[] = [];

	const { default_nickname } = server;
	if (default_nickname && (robloxUser || !default_nickname.includes('{name}')))
		nickname = default_nickname.replace('{name}', robloxUser?.displayName ?? '');

	const robloxRoles = robloxUser && serverLinks.some(bind => bind.requirements.some(r => r.type === MellowLinkRequirementType.HasRobloxGroupRole || r.type === MellowLinkRequirementType.HasRobloxGroupRankInRange)) ? await getRobloxUserRoles(robloxUser.id) : [];
	
	const metTypeReqs = serverLinks.flatMap(link => link.requirements.filter(r => r.type === MellowLinkRequirementType.MeetsOtherLink));
	const metTypeLinks = serverLinks.filter(link => metTypeReqs.find(item => item.data[0] === link.id));
	const requirementsCache: Record<string, boolean> = {};
	
	let removed = false, kicked = false, banned = false;
	for (const link of serverLinks) {
		const value = await meetsLink(user, link, robloxRoles, requirementsCache, metTypeLinks, robloxUser);
		if (link.type === MellowServerProfileActionType.GiveDiscordRoles) {
			if (value) {
				if (!link.data.every(id => member!.roles.includes(id))) {
					const filtered = link.data.filter(id => !member!.roles.includes(id));
					roles.push(...filtered);
					addedRoles.push(...filtered.map(r => discordServer.roles.find(j => j.id === r)!));
					rolesChanged = true;
				}
			} else {
				const filtered = roles.filter(id => !link.data.includes(id));
				if (!roles.every(id => filtered.includes(id))) {
					const filtered2 = link.data.filter(id => roles.includes(id));
					roles = filtered;
					removedRoles.push(...filtered2.map(r => discordServer.roles.find(j => j.id === r)!));
					rolesChanged = true;
				}
			}
		} else if (link.type === MellowServerProfileActionType.BanDiscord) {
			if (value && !banned) {
				removed = banned = true;
				await banMember(server.id, member.user.id, `Banned due to meeting the requirements of "${link.name}"${link.data[0] ? `.\n${link.data[0]}` : ''}`);
			}
		} else if (link.type === MellowServerProfileActionType.KickDiscord) {
			if (value && !removed) {
				removed = kicked = true;
				await kickMember(server.id, member.user.id, `Kicked due to meeting the requirements of "${link.name}"${link.data[0] ? `.\n${link.data[0]}` : ''}`);
			}
		}
	}

	const nickChanged = position <= mellowPosition && member.user.id !== discordServer.owner_id && nickname !== member.nick;
	if (!removed && (rolesChanged || nickChanged))
		await modifyMember(server.id, member.user.id, {
			nick: nickChanged ? nickname?.slice(0, 32) : undefined,
			roles
		}, executor ? `Forcefully synced by ${executor.user.global_name} (@${executor.user.username})` : 'Roblox Server Profile Sync');
	
	return {
		banned,
		kicked,
		addedRoles: removed ? [] : addedRoles,
		newNickname: nickname,
		removedRoles: removed ? [] : removedRoles,
		rolesChanged: rolesChanged && !removed,
		nicknameChanged: nickChanged && !removed
	};
}

async function meetsLink(user: User | undefined, { type, requirements, requirements_type }: MellowBind, robloxRoles: RobloxUserRolesResponse['data'], requirementsCache: Record<string, boolean>, metTypeLinks: MellowBind[], robloxUser?: PartialRobloxUser) {
	const requiresOne = requirements_type === MellowLinkRequirementsType.MeetOne;
	
	let metRequirements = 0;
	for (const item of requirements) {
		let met = false;
		const cached = requirementsCache[item.id];
		if (cached !== undefined) {
			if (cached)
				met = true;
		} else if (item.type === MellowLinkRequirementType.HasVerifiedUserLink) {
			/*if (user) {
				const { data, error } = await supabase.from('roblox_links').select('flags').eq('owner_id', user.id);
				if (error)
					throw error;
				met = data.some(link => hasFlag(link.flags, RobloxLinkFlag.Verified));
			}*/
			if (robloxUser)
				met = true;
		} else if (item.type === MellowLinkRequirementType.HasRobloxGroupRole)
			met = [...item.data].splice(1).every(id => robloxRoles.some(role => role.role.id.toString() == id));
		else if (item.type === MellowLinkRequirementType.HasRobloxGroupRankInRange) {
			const [group, min, max] = item.data;
			const min2 = parseInt(min), max2 = parseInt(max);
			met = robloxRoles.some(role => role.group.id.toString() === group && role.role.rank >= min2 && role.role.rank <= max2);
		} else if (item.type === MellowLinkRequirementType.InRobloxGroup)
			met = robloxRoles.some(role => role.group.id.toString() === item.data[0]);
		else if (item.type === MellowLinkRequirementType.MeetsOtherLink)
			met = await meetsLink(user, metTypeLinks.find(i => i.id === item.data[0])!, robloxRoles, requirementsCache, metTypeLinks);

		if (requirementsCache[item.id] = met)
			metRequirements++;
		if (requiresOne && metRequirements)
			return true;
	}

	return metRequirements === requirements.length || (requiresOne && !!metRequirements);
}