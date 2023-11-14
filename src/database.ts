import { createClient } from 'supabase-js';

import { SUPABASE_URL, SUPABASE_TOKEN } from './util/constants.ts';
import type { User, MellowServer, MellowProfileSyncAction } from './types.ts';

export const kv = await Deno.openKv();
export const supabase = createClient(SUPABASE_URL, SUPABASE_TOKEN);

export function getServer(serverId: string) {
	return supabase.from('mellow_servers')
		.select<string, MellowServer>('id, default_nickname, allow_forced_syncing, webhooks:mellow_server_webhooks ( events, enabled, target_url, request_method, request_headers )')
		.eq('id', serverId)
		.limit(1)
		.maybeSingle()
		.then(response => {
			if (response.error)
				throw response.error;
			return response.data;
		});
}

export async function getUser(userId: string) {
	const { data, error } = await supabase.from('users')
		.select<string, User>('*')
		.eq('id', userId)
		.limit(1)
		.maybeSingle();
	if (error)
		console.error(error);
	return data;
}

export async function getUserByDiscordId(userId: string) {
	return getUsersByDiscordId([userId]).then(users => users[0] ?? null);
}

export async function getUsersByDiscordId(userIds: string[]) {
	const { data, error } = await supabase.from('user_connections')
		.select('sub, user:users ( id, bio, name, flags, username, created_at, avatar_url )')
		.in('sub', userIds);
	if (error)
		console.error(error);
	return error ? [] : data.map(user => ({ ...user.user as any as typeof data[number]['user'][number], sub: user.sub }));
}

export async function getServerProfileSyncingActions(serverId: string): Promise<MellowProfileSyncAction[]> {
	const { data, error } = await supabase.from('mellow_binds')
		.select<string, any>('id, name, type, metadata, requirements_type, requirements:mellow_bind_requirements ( id, type, data )')
		.eq('server_id', serverId);
	if (error)
		console.error(error);
	return error ? [] : data;
}