import { ROBLOX_API } from '@hakumi/roblox-api';
import type { InventoryItem } from '@voxelified/roblox-open-cloud';
import { OpenCloudClient, OpenCloudApiKey } from '@voxelified/roblox-open-cloud';

import { hasFlag } from './util/mod.ts';
import { notifyMemberOfRemoval } from './syncing.ts';
import { ROBLOX_OPEN_CLOUD_API_KEY } from './util/constants.ts';
import { banMember, kickMember, modifyMember, getMemberPosition } from './discord.ts';
import { MellowProfileSyncActionRequirementType, MellowProfileSyncActionRequirementsType, MellowProfileSyncActionType, MellowServerAuditLogActionType } from './enums.ts';
import type { User, DiscordRole, MellowServer, DiscordGuild, DiscordMember, RobloxProfile, RobloxUserRolesResponse, MellowProfileSyncAction, RobloxServerProfileSyncResult } from './types.ts';

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
	let rolesChanged = false;

	const position = getMemberPosition(discordServer, member);
	const addedRoles: DiscordRole[] = [];
	const removedRoles: DiscordRole[] = [];

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
					addedRoles.push(...filtered.map(r => discordServer.roles.find(j => j.id === r)!));
					rolesChanged = true;
				}
			} else {
				const filtered = roles.filter(id => !metadata.items.includes(id));
				if (metadata.can_remove && !roles.every(id => filtered.includes(id))) {
					const filtered2 = metadata.items.filter(id => roles.includes(id));
					roles = filtered;
					removedRoles.push(...filtered2.map(r => discordServer.roles.find(j => j.id === r)!));
					rolesChanged = true;
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
	if (!removed && (rolesChanged || nickChanged))
		await modifyMember(server.id, member.user.id, {
			nick: nickChanged ? nickname?.slice(0, 32) : undefined,
			roles
		}, executor ? `Forcefully synced by ${executor.user.global_name} (@${executor.user.username})` : 'Roblox Server Profile Sync');
	
	for (const webhook of server.webhooks)
		if (webhook.enabled && hasFlag(webhook.events, MellowServerAuditLogActionType.RobloxServerProfileSync))
			await fetch(webhook.target_url, {
				body: JSON.stringify({
					type: 1,
					data: {
						guild_id: discordServer.id,
						member_id: member.user.id,
						roblox_id: robloxUser?.userId ?? null,
						forced_by: executor ? {
							id: executor.user.id
						} : null,
						added_roles: removed ? [] : addedRoles.filter(i => i).map(mapRoleForWebhook),
						removed_roles: removed ? [] : removedRoles.filter(i => i).map(mapRoleForWebhook)
					}
				}),
				method: webhook.request_method,
				headers: webhook.request_headers
			});

	return {
		banned,
		kicked,
		addedRoles: removed ? [] : addedRoles.filter(i => i),
		newNickname: nickname,
		removedRoles: removed ? [] : removedRoles.filter(i => i),
		rolesChanged: rolesChanged && !removed,
		nicknameChanged: nickChanged && !removed
	};
}

const mapRoleForWebhook = (role: DiscordRole) => ({ id: role.id, name: role.id });

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