import { UserConnectionType, MellowProfileSyncActionRequirementType } from './enums.ts';
export const MELLOW_SYNC_REQUIREMENT_CONNECTIONS: Record<MellowProfileSyncActionRequirementType, UserConnectionType | null> = {
	[MellowProfileSyncActionRequirementType.RobloxHaveConnection]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.RobloxHaveGroupRole]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.RobloxHaveGroupRankInRange]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.RobloxInGroup]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.RobloxBeFriendsWith]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.MeetOtherAction]: null,
	[MellowProfileSyncActionRequirementType.HAKUMIInTeam]: null,
	[MellowProfileSyncActionRequirementType.SteamInGroup]: null,
	[MellowProfileSyncActionRequirementType.RobloxHaveAsset]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.RobloxHaveBadge]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.RobloxHavePass]: UserConnectionType.Roblox,
	[MellowProfileSyncActionRequirementType.GitHubInOrganisation]: UserConnectionType.GitHub
};