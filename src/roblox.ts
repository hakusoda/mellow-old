import type { InventoryItem } from '@voxelified/roblox-open-cloud';
import { OpenCloudClient, OpenCloudApiKey } from '@voxelified/roblox-open-cloud';

import { notifyMemberOfRemoval } from './syncing.ts';
import { ROBLOX_OPEN_CLOUD_API_KEY } from './util/constants.ts';
import { banMember, kickMember, modifyMember, getMemberPosition } from './discord.ts';
import type { User, RoleChange, MellowServer, DiscordGuild, DiscordMember, RobloxProfile, RobloxUserRolesResponse, MellowProfileSyncAction, RobloxServerProfileSyncResult } from './types.ts';
import { RoleChangeType, MellowProfileSyncActionRequirementType, MellowProfileSyncActionRequirementsType, MellowProfileSyncActionType, MellowServerAuditLogActionType } from './enums.ts';

const openCloud = new OpenCloudClient(new OpenCloudApiKey(ROBLOX_OPEN_CLOUD_API_KEY));
export function getRobloxUserRoles(userId: string | number) {
	return fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`)
		.then(response => response.json())
		.then(data => (data as RobloxUserRolesResponse).data);
}

// TODO: rewrite in syncing.ts with multi-service support
export async function syncMember(executor: DiscordMember | null, server: MellowServer, syncActions: MellowProfileSyncAction[], discordServer: DiscordGuild, user: User | undefined, member: DiscordMember, robloxUser: RobloxProfile | undefined, mellowPosition: number): Promise<RobloxServerProfileSyncResult> {
	let roles = [...member.roles];
	let nickname = member.nick;

	const position = getMemberPosition(discordServer, member);
	const roleChanges: RoleChange[] = [];

	const { default_nickname } = server;
	if (default_nickname && robloxUser)
		nickname = default_nickname
			.replace('{roblox_username}', robloxUser.names.username)
			.replace('{roblox_display_name}', robloxUser.names.combinedName);

	const robloxRoles = robloxUser && syncActions.some(bind => bind.requirements.some(r => r.type === MellowProfileSyncActionRequirementType.RobloxHaveGroupRole || r.type === MellowProfileSyncActionRequirementType.RobloxHaveGroupRankInRange)) ? await getRobloxUserRoles(robloxUser.userId) : [];
	
	const robloxInventoryAssets = syncActions.flatMap(action => action.requirements.filter(r => r.type === MellowProfileSyncActionRequirementType.RobloxHaveAsset)).map(item => item.data[0]);
	const robloxInventoryBadges = syncActions.flatMap(action => action.requirements.filter(r => r.type === MellowProfileSyncActionRequirementType.RobloxHaveBadge)).map(item => item.data[0]);
	const robloxInventoryPasses = syncActions.flatMap(action => action.requirements.filter(r => r.type === MellowProfileSyncActionRequirementType.RobloxHavePass)).map(item => item.data[0]);
	
	let inventoryFilter: [string, string][] = [];
	if (robloxInventoryAssets.length)
		inventoryFilter.push(['assetIds', robloxInventoryAssets.join(',')]);
	if (robloxInventoryBadges.length)
		inventoryFilter.push(['badgeIds', robloxInventoryBadges.join(',')]);
	if (robloxInventoryPasses.length)
		inventoryFilter.push(['gamePassIds', robloxInventoryPasses.join(',')]);
	const robloxInventoryItems = robloxUser && inventoryFilter.length ?
		await openCloud.users.getInventoryItems(
			robloxUser.userId,
			100,
			inventoryFilter.map(i => `${i[0]}=${i[1]}`).join(';')
		)
	: { inventoryItems: [] };

	const metTypeReqs = syncActions.flatMap(link => link.requirements.filter(r => r.type === MellowProfileSyncActionRequirementType.MeetOtherAction));
	const metTypeLinks = syncActions.filter(link => metTypeReqs.find(item => item.data[0] === link.id));
	const requirementsCache: Record<string, boolean> = {};
	
	let removed = false, kicked = false, banned = false;
	for (const link of syncActions) {
		const value = await meetsActionRequirements(user, link, robloxRoles, requirementsCache, metTypeLinks, robloxInventoryItems.inventoryItems, robloxUser);
		const { type, metadata } = link;
		if (type === MellowProfileSyncActionType.GiveRoles) {
			if (value) {
				if (!metadata.items.every(id => member!.roles.includes(id))) {
					const filtered = metadata.items.filter(id => !member!.roles.includes(id));
					roles.push(...filtered);
					roleChanges.push(...filtered.map(target_id => ({
						type: RoleChangeType.Added,
						target_id,
						display_name: discordServer.roles.find(item => item.id === target_id)?.name!
					})));
				}
			} else {
				const filtered = roles.filter(id => !metadata.items.includes(id));
				if (metadata.can_remove && !roles.every(id => filtered.includes(id))) {
					const filtered2 = metadata.items.filter(id => roles.includes(id));
					roles = filtered;
					roleChanges.push(...filtered2.map(target_id => ({
						type: RoleChangeType.Removed,
						target_id,
						display_name: discordServer.roles.find(item => item.id === target_id)?.name!
					})));
				}
			}
		} else if (type === MellowProfileSyncActionType.BanFromServer) {
			if (value && !banned) {
				removed = banned = true;
				await notifyMemberOfRemoval(member.user.id, discordServer, 1, metadata.user_facing_reason);
				await banMember(server.id, member.user.id, `Banned due to meeting the requirements of "${link.name}"${metadata.audit_log_reason ? `.\n${metadata.audit_log_reason}` : ''}`);
			}
		} else if (type === MellowProfileSyncActionType.KickFromServer) {
			if (value && !removed) {
				removed = kicked = true;
				await notifyMemberOfRemoval(member.user.id, discordServer, 0, metadata.user_facing_reason);
				await kickMember(server.id, member.user.id, `Kicked due to meeting the requirements of "${link.name}"${metadata.audit_log_reason ? `.\n${metadata.audit_log_reason}` : ''}`);
			}
		}
	}

	const nickChanged = position <= mellowPosition && member.user.id !== discordServer.owner_id && nickname !== member.nick;
	if (!removed && (roleChanges.length || nickChanged))
		await modifyMember(server.id, member.user.id, {
			nick: nickChanged ? nickname?.slice(0, 32) : undefined,
			roles
		}, executor ? `Forcefully synced by ${executor.user.global_name} (@${executor.user.username})` : 'Roblox Server Profile Sync');

	return {
		banned,
		kicked,
		roleChanges,
		newNickname: nickname,
		nicknameChanged: nickChanged && !removed
	};
}

async function meetsActionRequirements(user: User | undefined, { requirements, requirements_type }: MellowProfileSyncAction, robloxRoles: RobloxUserRolesResponse['data'], requirementsCache: Record<string, boolean>, metTypeLinks: MellowProfileSyncAction[], robloxInventoryItems: InventoryItem[], robloxUser?: RobloxProfile) {
	const requiresOne = requirements_type === MellowProfileSyncActionRequirementsType.MeetOne;
	
	let metRequirements = 0;
	for (const item of requirements) {
		let met = false;
		const cached = requirementsCache[item.id];
		if (cached !== undefined)
			met = !!cached;
		else if (item.type === MellowProfileSyncActionRequirementType.RobloxHaveConnection)
			met = !!robloxUser;
		else if (item.type === MellowProfileSyncActionRequirementType.RobloxHaveGroupRole)
			met = [...item.data].splice(1).every(id => robloxRoles.some(role => role.role.id.toString() == id));
		else if (item.type === MellowProfileSyncActionRequirementType.RobloxHaveGroupRankInRange) {
			const [group, min, max] = item.data;
			const min2 = parseInt(min), max2 = parseInt(max);
			met = robloxRoles.some(role => role.group.id.toString() === group && role.role.rank >= min2 && role.role.rank <= max2);
		} else if (item.type === MellowProfileSyncActionRequirementType.RobloxInGroup)
			met = robloxRoles.some(role => role.group.id.toString() === item.data[0]);
		else if (item.type === MellowProfileSyncActionRequirementType.MeetOtherAction) {
			const otherAction = metTypeLinks.find(i => i.id === item.data[0]);
			if (otherAction)
				met = await meetsActionRequirements(user, otherAction, robloxRoles, requirementsCache, metTypeLinks, robloxInventoryItems, robloxUser);
		} else if (item.type === MellowProfileSyncActionRequirementType.RobloxHaveAsset)
			met = robloxInventoryItems.some(i => i.assetDetails?.assetId === item.data[0]);
		else if (item.type === MellowProfileSyncActionRequirementType.RobloxHaveBadge)
			met = robloxInventoryItems.some(i => i.badgeDetails?.badgeId === item.data[0]);
		else if (item.type === MellowProfileSyncActionRequirementType.RobloxHavePass)
			met = robloxInventoryItems.some(i => i.gamePassDetails?.gamePassId === item.data[0]);

		if (requirementsCache[item.id] = met)
			metRequirements++;
		if (requiresOne && metRequirements)
			return true;
	}

	return metRequirements === requirements.length || (requiresOne && !!metRequirements);
}