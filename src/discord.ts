import { DISCORD_TOKEN, DISCORD_APP_ID } from './util/constants.ts';
import type { DiscordModifyMemberOptions } from './types.ts';
import type { InteractionCallbackData, DiscordCreateApplicationCommand } from 'discordeno';

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

export function editOriginalResponse(token: string, message: InteractionCallbackData) {
	return makeRequest(`/webhooks/${DISCORD_APP_ID}/${token}/messages/@original`, {
		body: JSON.stringify(message),
		method: 'PATCH'
	});
}

export function modifyMember(serverId: string, userId: string, options: DiscordModifyMemberOptions, reason?: string) {
	return makeRequest(`/guilds/${serverId}/members/${userId}`, {
		body: JSON.stringify(options),
		method: 'PATCH',
		headers: reason ? {
			'x-audit-log-reason': reason
		} : undefined
	});
}

export const API_BASE = 'https://discord.com/api/v10/';