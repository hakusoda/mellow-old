import { upsertGlobalApplicationCommands } from 'discordeno';
import { Interaction, InteractionResponse, InteractionCallbackData, ApplicationCommandOption } from 'discordeno';

import type { Response } from './response.ts';
import { ping, testinfo } from './general/mod.ts';
import { PermissionLevels } from '../util/permissions.ts';
export const commands: Record<string, Command> = {
	ping,
	testinfo
}
export enum CommandType {
	Global
}
export type CommandResponse = InteractionResponse | InteractionCallbackData | Promise<InteractionResponse | InteractionCallbackData>
export interface Command {
	type?: CommandType
	execute: (payload: Interaction) => Response | CommandResponse
	options?: ApplicationCommandOption[]
	description?: string
	permissionLevels?: ((payload: Interaction, command: Command) => boolean | Promise<boolean>) | (keyof typeof PermissionLevels)[]
}

export function command(execute: Command["execute"], options?: Command) {
	return {
		type: CommandType.Global,
		execute,
		...options
	};
}

export async function processCommand(command: Command, payload: Interaction) {
	const response = await command.execute(payload);
	if (typeof response === 'function')
		return response(payload);
	return response;
}

import bot from '../bot.ts';
export async function registerGlobalCommands() {
	await upsertGlobalApplicationCommands(bot, Object.entries(commands).filter(c => c[1].type === CommandType.Global).map(([name, cmd]) => ({
		name,
		description: cmd.description ?? 'this description does not exist 🦑'
	})));
}