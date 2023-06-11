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

export enum DiscordChannelType {
	Text
}
export enum DiscordInteractionType {
	Ping = 1,
	ApplicationCommand,
	MessageComponent,
	ApplicationCommandAutocomplete,
	ModalSubmit
}