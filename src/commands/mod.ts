import { Interaction, InteractionResponse, InteractionCallbackData, ApplicationCommandOption } from 'discordeno';
import { upsertGlobalApplicationCommands } from 'discordeno';

import { ping } from './general/mod.ts';
import { PermissionLevels } from '../util/permissions.ts';
export const commands: Record<string, Command> = {
	ping
}
export interface Command {
	guild?: boolean
	global?: boolean
	execute: (payload: Interaction) => InteractionResponse | InteractionCallbackData | Promise<InteractionResponse | InteractionCallbackData>
	enabled?: boolean
	options?: ApplicationCommandOption[]
	advanced?: boolean
	description?: string
	permissionLevels?: ((payload: Interaction, command: Command) => boolean | Promise<boolean>) | (keyof typeof PermissionLevels)[]
}

import bot from '../bot.ts';
export async function registerGlobalCommands() {
	await upsertGlobalApplicationCommands(bot, Object.entries(commands).filter(c => c[1].global).map(([name, cmd]) => ({
		name,
		description: 'this description does not exist 🦑'
	})));
}