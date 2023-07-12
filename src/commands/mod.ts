import { getFixedT } from 'i18next';
import { InteractionResponse, InteractionCallbackData } from 'discordeno';

import { LOCALES } from '../localisation/mod.ts';
import type { Response } from './response.ts';
import { overwriteGlobalCommands } from '../discord.ts';
import { DiscordApplicationCommandOptionType } from '../enums.ts';
import type { DiscordInteraction, CommandExecutePayload, DiscordApplicationCommandOptions, DiscordApplicationCommandOptionTypeMap, DiscordApplicationIntegerNumberCommandOption } from '../types.ts';

import { verify, update, verifyall } from './roblox/mod.ts';
import { ping, roll, whois, pokemon } from './general/mod.ts';
export const commands: Record<string, Command<any>> = {
	ping,
	roll,
	whois,
	verify,
	update,
	pokemon,
	verifyall
}
export type CommandResponse = InteractionResponse | InteractionCallbackData | Promise<InteractionResponse | InteractionCallbackData>
export interface Command<T extends readonly DiscordApplicationCommandOptions[]> {
	execute: (payload: CommandExecutePayload, data: { [K in keyof T as T[K & number]['name']]: DiscordApplicationCommandOptionTypeMap[T[K]['type'] & number] }) => Response | Promise<Response> | CommandResponse
	options?: T
	description?: string
	defaultMemberPermissions?: string
}
export interface CommandOptions<T extends readonly DiscordApplicationCommandOptions[]> {
	options?: T
	description?: string
	defaultMemberPermissions?: string
}

export function command<T extends readonly DiscordApplicationCommandOptions[]>(execute: Command<T>['execute'], options?: CommandOptions<T>): Command<T> {
	return {
		execute,
		...options
	};
}

export async function processCommand(command: Command<any>, payload: DiscordInteraction) {
	const { options, resolved } = payload.data;
	const data = Object.fromEntries(options?.map(({ name, type, value }) => {
		if (type === DiscordApplicationCommandOptionType.User)
			return [name, {
				...resolved!.members?.[value]!,
				user: resolved!.users?.[value]!
			}];
		return [name, value];
	}) ?? []);

	const response = await command.execute({
		t: getFixedT(payload.locale, 'command'),
		...payload
	}, data);
	if (typeof response === 'function')
		return response(payload);
	return response;
}

export function registerGlobalCommands() {
	return overwriteGlobalCommands(Object.entries(commands).map(([name, cmd]) => ({
		name,
		options: cmd.options,
		description: cmd.description ?? 'this description does not exist 🦑',
		name_localizations: Object.fromEntries(LOCALES.map(lng => [lng, getFixedT(lng, 'command')(name)])),
		description_localizations: Object.fromEntries(LOCALES.map(lng => [lng, getFixedT(lng, 'command')([name + '.summary', 'placeholder.summary'])])),
		default_member_permissions: cmd.defaultMemberPermissions
	})) as any[]);
}