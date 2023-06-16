import type { MellowLinkType, DiscordChannelType, DiscordInteractionType, MellowLinkRequirementType, MellowLinkRequirementsType } from './enums.ts';
export interface RobloxLink {
	id: string
	owner: string
}

export interface User {
	id: string
	bio: string
	name: string
	flags: number
	created: string
	username: string
}
export interface MellowBind {
	id: number
	type: MellowLinkType

	target_ids: string[]

	requirements: {
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
	nick?: string
	mute?: boolean
	deaf?: boolean
	flags?: number
	roles?: string[]
	channel_id?: string
	communication_disabled_until?: string
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

export type TranslateFn = (keys: string | string[], ...args: any[]) => string

export interface CommandExecutePayload extends DiscordInteraction {
	t: TranslateFn
}