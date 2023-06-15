import { getFixedT } from 'i18next';
import { InteractionResponse, InteractionCallbackData, ApplicationCommandOption } from 'discordeno';

import { LOCALES } from '../localization/mod.ts';
import type { Response } from './response.ts';
import { PermissionLevels } from '../util/permissions.ts';
import type { DiscordInteraction } from '../types.ts';
import { overwriteGlobalCommands } from '../discord.ts';

import { verify } from './roblox/mod.ts';
import { ping, roll, pokemon } from './general/mod.ts';
export const commands: Record<string, Command> = {
	ping,
	roll,
	verify,
	pokemon
}
export type CommandResponse = InteractionResponse | InteractionCallbackData | Promise<InteractionResponse | InteractionCallbackData>
export interface CommandExecutePayload extends DiscordInteraction {
	t: (keys: string | string[], ...args: any[]) => string
}
export interface Command {
	execute: (payload: CommandExecutePayload) => Response | Promise<Response> | CommandResponse
	options?: ApplicationCommandOption[]
	description?: string
	permissionLevels?: ((payload: DiscordInteraction, command: Command) => boolean | Promise<boolean>) | (keyof typeof PermissionLevels)[]
}

export function command(execute: Command["execute"], options?: Command) {
	return {
		execute,
		...options
	};
}

export async function processCommand(command: Command, payload: DiscordInteraction) {
	const response = await command.execute({
		t: getFixedT(payload.locale, 'command'),
		...payload
	});
	if (typeof response === 'function')
		return response(payload);
	return response;
}

export function registerGlobalCommands() {
	return overwriteGlobalCommands(Object.entries(commands).map(([name, cmd]) => ({
		name,
		description: cmd.description ?? 'this description does not exist 🦑',
		name_localizations: Object.fromEntries(LOCALES.map(lng => [lng, getFixedT(lng, 'command')(name)])),
		description_localizations: Object.fromEntries(LOCALES.map(lng => [lng, getFixedT(lng, 'command')([name + '.summary', 'placeholder.summary'])]))
	})));
}