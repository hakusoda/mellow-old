export enum MellowLinkType {
	Role
}
export enum MellowLinkRequirementType {
	HasVerifiedUserLink,
	HasRobloxGroupRole,
	HasRobloxGroupRankInRange
}
export enum MellowLinkRequirementsType {
	MeetAll,
	MeetOne
}

export enum RobloxLinkFlag {
	None,
	Verified = 1 << 1
}

export enum UserFlag {
	
}

// https://discord.com/developers/docs/resources/channel#channel-object-channel-types
export enum DiscordChannelType {
	Text
}

// https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type
export enum DiscordInteractionType {
	Ping = 1,
	ApplicationCommand,
	MessageComponent,
	ApplicationCommandAutocomplete,
	ModalSubmit
}

// https://discord.com/developers/docs/resources/channel#message-object-message-flags
export enum DiscordMessageFlag {
	Crossposted = 1 << 0,
	IsCrosspost = 1 << 1,
	SuppressEmbeds = 1 << 2,
	SourceMessageDeleted = 1 << 3,
	Urgent = 1 << 4,
	HasThread = 1 << 5,
	Ephemeral = 1 << 6,
	Loading = 1 << 7,
	FailedToMentionSomeRolesInThread = 1 << 8,
	SuppressNotifications = 1 << 12,
	IsVoiceMessage = 1 << 13
}