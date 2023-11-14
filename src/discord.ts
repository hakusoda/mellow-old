import { DISCORD_TOKEN, DISCORD_APP_ID } from './util/constants.ts';
import type { InteractionCallbackData, DiscordCreateApplicationCommand } from 'discordeno';
import type { DiscordRole, DiscordGuild, DiscordMember, DiscordChannel, DiscordModifyMemberOptions } from './types.ts';

export function makeRequest<T = any>(path: string, options: RequestInit = {}): Promise<{ success: false } | { data: T, success: true }> {
	options.headers = {
		accept: 'application/json',
		authorization: `Bot ${DISCORD_TOKEN}`,
		'content-type': options.body ? 'application/json' : undefined,
		...options.headers
	};
	return fetch(API_BASE + path, options)
		.then(async response => {
			if (response.status > 199 && response.status < 400)
				return { data: await response.json().catch(() => null), success: true };
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

export function createChannelMessage(channelId: string, payload: any) {
	return makeRequest(`/channels/${channelId}/messages`, {
		body: JSON.stringify(payload),
		method: 'POST'
	}).then(response => {
		if (!response.success)
			throw new Error();
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

export function getServerMembers(serverId: string) {
	return makeRequest<DiscordMember[]>(`/guilds/${serverId}/members?limit=1000`)
		.then(response => response.success ? response.data : []);
}

export function modifyMember(serverId: string, userId: string, options: DiscordModifyMemberOptions, reason?: string) {
	return makeRequest(`/guilds/${serverId}/members/${userId}`, {
		body: JSON.stringify(options),
		method: 'PATCH',
		headers: reason ? {
			'x-audit-log-reason': reason
		} : undefined
	}).then(response => {
		if (!response.success)
			throw new Error();
	})
}

export function banMember(serverId: string, userId: string, reason?: string) {
	return makeRequest(`/guilds/${serverId}/bans/${userId}`, {
		method: 'PUT',
		headers: reason ? {
			'x-audit-log-reason': encodeURIComponent(reason)
		} : undefined
	}).then(response => {
		if (!response.success)
			throw new Error();
	})
}

export function kickMember(serverId: string, userId: string, reason?: string) {
	return makeRequest(`/guilds/${serverId}/members/${userId}`, {
		method: 'DELETE',
		headers: reason ? {
			'x-audit-log-reason': encodeURIComponent(reason)
		} : undefined
	}).then(response => {
		if (!response.success)
			throw new Error();
	})
}

export function upsertUserChannel(userId: string) {
	return makeRequest<DiscordChannel>('/users/@me/channels', {
		body: JSON.stringify({ recipient_id: userId }),
		method: 'POST'
	}).then(response => response.success ? response.data : null);
}

export function getDiscordServer(serverId: string) {
	return makeRequest<DiscordGuild>(`/guilds/${serverId}?with_counts=true`)
		.then(response => response.success ? response.data : null);
}

export function getServerRoles(serverId: string) {
	return makeRequest<DiscordRole[]>(`/guilds/${serverId}/roles`)
		.then(response => response.success ? response.data : []);
}

export const getMemberPosition = (server: DiscordGuild, member: DiscordMember) =>
	member.roles.map(role => server.roles.find(r => r.id === role)!)
		.sort((a, b) => b.position - a.position)[0]?.position ?? 0;

export const API_BASE = 'https://discord.com/api/v10/';