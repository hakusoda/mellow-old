import { DISCORD_TOKEN, DISCORD_APP_ID } from './util/constants.ts';
import type { DiscordCreateApplicationCommand } from 'discordeno';

export function makeRequest(path: string, options: RequestInit = {}) {
	options.headers = {
		authorization: `Bot ${DISCORD_TOKEN}`,
		'content-type': 'application/json',
		...options.headers
	};
	return fetch(API_BASE + path, options);
}

export function overwriteGlobalCommands(commands: DiscordCreateApplicationCommand[]) {
	return makeRequest(`applications/${DISCORD_APP_ID}/commands`, {
		body: JSON.stringify(commands),
		method: 'PUT'
	});
}

export const API_BASE = 'https://discord.com/api/v10/';