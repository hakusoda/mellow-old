export enum MellowServerProfileActionType {
	GiveDiscordRoles,
	BanDiscord,
	KickDiscord
}
export enum MellowLinkRequirementType {
	HasVerifiedUserLink,
	HasRobloxGroupRole,
	HasRobloxGroupRankInRange,
	InRobloxGroup,
	IsFriendsWith,
	MeetsOtherLink
}
export enum MellowLinkRequirementsType {
	MeetAll,
	MeetOne
}

export enum MellowServerAuditLogType {
	CreateServer,
	CreateRobloxLink,
	UpdateRobloxGlobalSettings,
	DeleteRobloxLink,
	UpdateRobloxLink,
	UpdateLogging
}

export enum MellowServerLogType {
	None,
	AuditLog = 1 << 0,
	ServerProfileSync = 1 << 1
}

export enum RobloxLinkFlag {
	None,
	Verified = 1 << 1
}

export enum UserFlag {
	None,
	Staff = 1 << 1,
	Tester = 1 << 2
}

export enum CustomCommandActionType {
	GetRandomIntegerBetween,
	IfStatement,
	EndWithMessage
}

export enum CustomCommandActionParentType {
	UseActionResult,
	IfStatementThen,
	IfStatementElse
}

export enum CustomCommandIfStatementType {
	Equals
}

export enum CustomCommandActionResultType {
	None,
	Data,
	Finish
}

// https://discord.com/developers/docs/resources/channel#channel-object-channel-types
export enum DiscordChannelType {
	GuildText,
	UserDM,
	GuildVoice,
	GroupDM,
	GuildCategory,
	GuildAnnouncement,
	AnnouncementThread = 10,
	PublicThread,
	PrivateThread,
	GuildStageVoice,
	GuildDirectory,
	GuildForum
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

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
export enum DiscordApplicationCommandOptionType {
	SubCommand = 1,
	SubCommandGroup,
	String,
	Integer,
	Boolean,
	User,
	Channel,
	Role,
	Mentionable,
	Number,
	Attachment
}