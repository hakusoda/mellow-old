export enum MellowBindType {
	Role
}
export enum MellowBindRequirementType {
	HasVerifiedUserLink,
	HasRobloxGroupRole
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