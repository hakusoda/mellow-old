import { createClient } from 'supabase-js';

import { SUPABASE_URL, SUPABASE_TOKEN } from './util/constants.ts';
import type { User, Database, MellowBind } from './types.ts';
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_TOKEN);

export function getRobloxLink(linkId: string) {
	return supabase.from('roblox_links').select('*').eq('id', linkId);
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

export async function getDiscordServerBinds(serverId: string): Promise<MellowBind[]> {
	const { data, error } = await supabase.from('mellow_binds').select<string, any>('id, type, target_ids, requirements:mellow_bind_requirements ( type, data ), requirements_type').eq('server_id', serverId);
	if (error)
		console.error(error);
	return error ? [] : data;
}