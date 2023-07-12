import type { MellowLinkType, DiscordChannelType, DiscordInteractionType, MellowLinkRequirementType, MellowLinkRequirementsType, DiscordApplicationCommandOptionType } from './enums.ts';
export interface RobloxLink {
	id: string
	owner: string
}

export interface User {
	id: string
	bio: string
	name: string
	flags: number
	username: string
	created_at: string
	avatar_url: string
	mellow_ids: string[]
	primary_roblox_link_id: string | null
}

export interface MellowServer {
	id: string
	default_nickname: string
}
export interface MellowBind {
	id: string
	type: MellowLinkType

	target_ids: string[]

	requirements: {
		id: string
		data: string[]
		type: MellowLinkRequirementType
	}[]
	requirements_type: MellowLinkRequirementsType
}

export interface Database {
	public: {
		Views: {}
		Tables: {
			users: {
				Row: User & Record<string, unknown>
				Insert: {}
				Update: {}
			}
			mellow_binds: {
				Row: MellowBind & Record<string, unknown>
				Insert: {}
				Update: {}
			}
			mellow_signups: {
				Row: {
					id: number
					locale: string
					user_id: string
					server_id: string
					interaction_token: string
				}
				Insert: {}
				Update: {}
			}
		}
		Functions: {
			get_user_by_discord_user_id: {
				Args: {
					discord_user_id: string
				}
				Returns: User
			}
		}
	}
}

// https://discord.com/developers/docs/reference#locales
export type DiscordLocale = 'ja' | 'en-US'

export interface DiscordPartialUser {
	id: string
	avatar: string | null
	username: string
	global_name: string
	public_flags: number
	discriminator: string
	avatar_decoration: string | null
}

// https://discord.com/developers/docs/resources/guild#guild-member-object
export interface DiscordMember {
	deaf: boolean
	mute: boolean
	nick: string | null
	user: DiscordPartialUser
	flags: number
	roles: string[]
	avatar: string | null
	pending: boolean
	joined_at: string
	permissions: string
	premium_since: unknown
	communication_disabled_until: unknown
}

// https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-structure
export interface DiscordInteraction {
	type: DiscordInteractionType
	data: {
		id?: string
		name?: string
		type?: number
		options?: {
			name: string
			type: DiscordApplicationCommandOptionType
			value: string
		}[]
		resolved?: {
			users?: Record<string, DiscordPartialUser>
			members?: Record<string, DiscordMember>
		}
		custom_id?: string
		component_type?: number
	}
	user: DiscordPartialUser | undefined
	token: string
	locale: DiscordLocale
	version: 1
	channel: {
		id: string
		name: string
		nsfw: boolean
		type: DiscordChannelType
		flags: number
		topic: string | null
		guild_id: string
		position: number
		parent_id: string
		icon_emoji: {
			id: unknown
			name: string
		}
		permissions: string
		theme_color: unknown
		last_message_id: string
		rate_limit_per_user: number
	}
	member: DiscordMember | null
	guild_id: string
	channel_id: string
	entitlements: unknown[]
	guild_locale: DiscordLocale
	application_id: string
	app_permissions: string
	entitlement_sku_ids: unknown[]
}

// https://discord.com/developers/docs/resources/guild#modify-guild-member-json-params
export interface DiscordModifyMemberOptions {
	nick?: string | null
	mute?: boolean
	deaf?: boolean
	flags?: number
	roles?: string[]
	channel_id?: string
	communication_disabled_until?: string
}

// https://discord.com/developers/docs/resources/guild#guild-object-guild-features
export enum DiscordGuildFeature {
	Banner = 'BANNER',
	Verified = 'VERIFIED',
	Community = 'COMMUNITY',
	RoleIcons = 'ROLE_ICONS',
	VanityUrl = 'VANITY_URL',
	Featurable = 'FEATURABLE',
	VipRegions = 'VIP_REGIONS',
	Discoverable = 'DISCOVERABLE',
	AnimatedIcon = 'ANIMATED_ICON',
	InviteSplash = 'INVITE_SPLASH',
	MoreStickers = 'MORE_STICKERS',
	PreviewEnabled = 'PREVIEW_ENABLED',
	AnimatedBanner = 'ANIMATED_BANNER',
	AutoModeration = 'AUTO_MODERATION',
	InvitesDisabled = 'INVITES_DISABLED',
	CreatorStorePage = 'CREATOR_STORE_PAGE',
	RaidAlertsDisabled = 'RAID_ALERTS_DISABLED',
	CreatorMonetisation = 'CREATOR_MONETIZABLE_PROVISIONAL',
	AnnouncementChannels = 'NEWS',
	WelcomeScreenEnabled = 'WELCOME_SCREEN_ENABLED',
	TicketedEventsEnabled = 'TICKETED_EVENTS_ENABLED',
	DeveloperSupportServer = 'DEVELOPER_SUPPORT_SERVER',
	RoleSubscriptionsEnabled = 'ROLE_SUBSCRIPTIONS_ENABLED',
	RoleSubscriptionsAvailable = 'ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE',
	MemberVerificationGateEnabled = 'MEMBER_VERIFICATION_GATE_ENABLED',
	ApplicationCommandPermissionsV2 = 'APPLICATION_COMMAND_PERMISSIONS_V2'
}

// https://discord.com/developers/docs/resources/guild#guild-object-guild-structure
export interface DiscordGuild {
	id: string
	name: string
	icon: string | null
	roles: DiscordRole[]
	owner?: boolean
	splash: string | null
	banner: string | null
	emojis: DiscordEmoji[]
	owner_id: string
	features: DiscordGuildFeature[]
	stickers?: DiscordSticker[]
	mfa_level: DiscordGuildMFALevel
	icon_hash?: string | null
	nsfw_level: DiscordGuildNSFWLevel
	afk_timeout: number
	description: string | null
	permissions?: string
	max_members?: number
	premium_tier: DiscordGuildPremiumTier
	max_presences?: number | null
	application_id: string | null
	afk_channel_id: string | null
	widget_enabled?: boolean
	welcome_screen?: DiscordWelcomeScreen
	vanity_url_code: string | null
	preferred_locale: DiscordLocale
	rules_channel_id: string | null
	discovery_splash: string | null
	system_channel_id: string | null
	widget_channel_id?: string | null
	verification_level: number
	system_channel_flags: number
	explicit_content_filter: number
	max_video_channel_users?: number
	safety_alerts_channel_id: string | null
	approximate_member_count?: number
	public_updates_channel_id: string | null
	approximate_presence_count?: number
	premium_subscription_count?: number
	premium_progress_bar_enabled: boolean
	default_message_notifications: number
	max_stage_video_channel_users?: number
}

// https://discord.com/developers/docs/resources/guild#welcome-screen-object-welcome-screen-structure
export interface DiscordWelcomeScreen {
	description: string | null
	welcome_channels: DiscordWelcomeScreenChannel[]
}

// https://discord.com/developers/docs/resources/guild#welcome-screen-object-welcome-screen-channel-structure
export interface DiscordWelcomeScreenChannel {
	emoji_id: string | null
	channel_id: string
	emoji_name: string | null
	description: string
}

// https://discord.com/developers/docs/resources/guild#guild-object-mfa-level
export enum DiscordGuildMFALevel {
	None,
	Elevated
}

// https://discord.com/developers/docs/resources/guild#guild-object-verification-level
export enum DiscordGuildVerificationLevel {
	None,
	Low,
	Medium,
	High,
	VeryHigh
}

// https://discord.com/developers/docs/resources/guild#guild-object-guild-nsfw-level
export enum DiscordGuildNSFWLevel {
	Default,
	Explict,
	Safe,
	AgeRestricted
}

// https://discord.com/developers/docs/resources/guild#guild-object-premium-tier
export enum DiscordGuildPremiumTier {
	None,
	Tier1,
	Tier2,
	Tier3
}

// https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-structure
export interface DiscordSticker {
	id: string
	name: string
	tags: string
	type: DiscordStickerType
	asset: ''
	user?: DiscordPartialUser
	pack_id: string | null
	guild_id?: string
	available?: boolean
	sort_value?: number
	description: string | null
	format_type: DiscordStickerFormatType
}

// https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-types
export enum DiscordStickerType {
	Standard = 1,
	Guild
}

// https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-format-types
export enum DiscordStickerFormatType {
	PNG = 1,
	APNG,
	LOTTIE,
	GIF
}

// https://discord.com/developers/docs/resources/emoji#emoji-object-emoji-structure
export interface DiscordEmoji {
	id: string | null
	name: string | null
	user?: DiscordPartialUser
	roles?: string[]
	managed?: boolean
	animated?: boolean
	available?: boolean
	require_colons?: boolean
}

// https://discord.com/developers/docs/topics/permissions#role-object-role-structure
export interface DiscordRole {
	id: string
	name: string
	icon: string | null
	flags: number
	color: number
	hoist: boolean
	managed: boolean
	position: number
	permissions: string
	mentionable: boolean
	description: string | null
	unicode_emoji: string | null
}

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
export interface DiscordApplicationCommandOption {
	name: string
	type: DiscordApplicationCommandOptionType
	required?: boolean
	description: string
	channel_types?: DiscordChannelType[]
}

export interface DiscordApplicationStringCommandOption extends DiscordApplicationCommandOption {
	type: DiscordApplicationCommandOptionType.String
	choices: DiscordApplicationCommandOptionChoice<string>[]
	min_length?: number
	max_length?: number
	autocomplete?: boolean
}

export interface DiscordApplicationIntegerNumberCommandOption extends DiscordApplicationCommandOption {
	type: DiscordApplicationCommandOptionType.Integer | DiscordApplicationCommandOptionType.Number
	choices: DiscordApplicationCommandOptionChoice<number>[]
	min_value?: number
	max_value?: number
	autocomplete?: boolean
}

export type DiscordApplicationCommandOptions = DiscordApplicationStringCommandOption | DiscordApplicationIntegerNumberCommandOption | DiscordApplicationCommandOption

export interface DiscordApplicationCommandOptionTypeMap {
	[DiscordApplicationCommandOptionType.User]: DiscordMember
	[DiscordApplicationCommandOptionType.String]: string
	[DiscordApplicationCommandOptionType.Number]: number
	[DiscordApplicationCommandOptionType.Integer]: number
}

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-choice-structure
export interface DiscordApplicationCommandOptionChoice<T> {
	name: string
	value: T
}

export type TranslateFn = (keys: string | string[], ...args: any[]) => string

export interface CommandExecutePayload extends DiscordInteraction {
	t: TranslateFn
}

export interface PartialRobloxUser {
	id: number
	name: string
	displayName: string
	hasVerifiedBadge: boolean
}

export interface RobloxUsersResponse {
	data: PartialRobloxUser[]
}

export interface RobloxUserRolesResponse {
	data: {
		role: {
			id: number
			name: string
			rank: number
		}
		group: {
			id: number
			name: string
			memberCount: number
			hasVerifiedBadge: boolean
		}
	}[]
}