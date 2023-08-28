import { createClient } from 'supabase-js';

import { SUPABASE_URL, SUPABASE_TOKEN } from './util/constants.ts';
import type { User, Database, MellowBind, MellowServer } from './types.ts';
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_TOKEN);

export function getRobloxLink(linkId: string) {
	return supabase.from('roblox_links').select('*').eq('id', linkId);
}

export function getServer(serverId: string) {
	return supabase.from('mellow_servers').select<string, MellowServer>('id, default_nickname, sync_unknown_users, allow_forced_syncing').eq('id', serverId).limit(1).maybeSingle()
		.then(response => response.data);
}

export async function getUser(userId: string): Promise<User | null> {
	const { data, error } = await supabase.from('users').select('*').eq('id', userId);
	if (error)
		console.error(error);
	return error ? null : data[0];
}

export async function getUserByDiscordId(userId: string) {
	/*const { data, error } = await supabase.rpc('get_user_by_discord_user_id', {
		discord_user_id: userId
	});
	if (error)
		console.error(error);
	return error ? null : data;*/
	return getUsersByDiscordId([userId]).then(users => users[0] ?? null);
}

export async function getUsersByDiscordId(userIds: string[]) {
	const { data, error } = await supabase.from('user_connections').select('sub, user:users (*)').in('sub', userIds);
	if (error)
		console.error(error);
	return error ? [] : data.map(user => ({ ...user.user as any as typeof data[number]['user'][number], sub: user.sub }));
}

export async function getDiscordServerBinds(serverId: string): Promise<MellowBind[]> {
	const { data, error } = await supabase.from('mellow_binds').select<string, any>('id, name, type, data, requirements:mellow_bind_requirements ( id, type, data ), requirements_type').eq('server_id', serverId);
	if (error)
		console.error(error);
	return error ? [] : data;
}