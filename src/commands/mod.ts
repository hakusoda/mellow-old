import { getFixedT } from 'i18next';
import { Interaction, InteractionResponse, InteractionCallbackData, ApplicationCommandOption } from 'discordeno';

import { LOCALES } from '../localization/mod.ts';
import type { Response } from './response.ts';
import { PermissionLevels } from '../util/permissions.ts';
import { overwriteGlobalCommands } from '../discord.ts';
import { ping, roll, pokemon } from './general/mod.ts';
export const commands: Record<string, Command> = {
	ping,
	roll,
	pokemon
}
export type CommandResponse = InteractionResponse | InteractionCallbackData | Promise<InteractionResponse | InteractionCallbackData>
export interface CommandExecutePayload extends Interaction {
	// deno-lint-ignore no-explicit-any
	t: (keys: string | string[], ...args: any[]) => string
}
export interface Command {
	execute: (payload: CommandExecutePayload) => Response | CommandResponse
	options?: ApplicationCommandOption[]
	description?: string
	permissionLevels?: ((payload: Interaction, command: Command) => boolean | Promise<boolean>) | (keyof typeof PermissionLevels)[]
}

export function command(execute: Command["execute"], options?: Command) {
	return {
		execute,
		...options
	};
}

export async function processCommand(command: Command, payload: Interaction) {
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