import { DISCORD_TOKEN, DISCORD_APP_ID } from './util/constants.ts';
import type { DiscordRole, DiscordMember, DiscordModifyMemberOptions } from './types.ts';
import type { InteractionCallbackData, DiscordCreateApplicationCommand } from 'discordeno';

export function makeRequest<T = any>(path: string, options: RequestInit = {}): Promise<{ success: false } | { data: T, success: true }> {
	options.headers = {
		authorization: `Bot ${DISCORD_TOKEN}`,
		'content-type': 'application/json',
		...options.headers
	};
	return fetch(API_BASE + path, options)
		.then(async response => {
			if (response.status === 200)
				return { data: await response.json(), success: true };
			console.error(response.status, await response.text().catch(() => ''));
			return { success: false };
		});
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
	}).then(response => {
		if (!response.success)
			throw new Error();
	});
}

export function getServerMember(serverId: string, userId: string) {
	return makeRequest<DiscordMember>(`/guilds/${serverId}/members/${userId}`)
		.then(response => response.success ? response.data : null);
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

export function getServerRoles(serverId: string) {
	return makeRequest<DiscordRole[]>(`/guilds/${serverId}/roles`)
		.then(response => response.success ? response.data : []);
}

export const API_BASE = 'https://discord.com/api/v10/';