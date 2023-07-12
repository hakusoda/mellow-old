import { createClient } from 'supabase-js';

import { SUPABASE_URL, SUPABASE_TOKEN } from './util/constants.ts';
import type { User, Database, MellowBind, MellowServer } from './types.ts';
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_TOKEN);

export function getRobloxLink(linkId: string) {
	return supabase.from('roblox_links').select('*').eq('id', linkId);
}

export async function getServer(serverId: string): Promise<MellowServer | null> {
	return await supabase.from('mellow_servers').select('id, default_nickname').eq('id', serverId).limit(1).maybeSingle()
		.then(response => response.data);
}

export async function getUser(userId: string): Promise<User | null> {
	const { data, error } = await supabase.from('users').select('*').eq('id', userId);
	if (error)
		console.error(error);
	return error ? null : data[0];
}

export async function getUserByDiscordId(userId: string) {
	const { data, error } = await supabase.rpc('get_user_by_discord_user_id', {
		discord_user_id: userId
	});
	if (error)
		console.error(error);
	return error ? null : data;
}

export async function getUsersByDiscordId(userIds: string[]) {
	const { data, error } = await supabase.from('users').select('*').overlaps('mellow_ids', userIds);
	if (error)
		console.error(error);
	return error ? [] : data;
}

export async function getDiscordServerBinds(serverId: string): Promise<MellowBind[]> {
	const { data, error } = await supabase.from('mellow_binds').select<string, any>('id, type, target_ids, requirements:mellow_bind_requirements ( id, type, data ), requirements_type').eq('server_id', serverId);
	if (error)
		console.error(error);
	return error ? [] : data;
}