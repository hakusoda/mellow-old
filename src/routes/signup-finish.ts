import { verify } from '../commands/roblox/verify.ts';
import { MELLOW_KEY } from '../util/constants.ts';
import { getServerMember } from '../discord.ts';
import { getUser, supabase } from '../database.ts';
export default async (request: Request) => {
	if (request.headers.get('x-api-key') !== MELLOW_KEY)
		return new Response('missing key', { status: 403 });

	const [userId, discordId] = (await request.text()).split(':');
	const user = await getUser(userId);
	if (!user)
		return new Response('invalid user', { status: 400 });

	const { data, error } = await supabase.from('mellow_signups').select('*').eq('user_id', discordId).limit(1).single();
	if (error)
		console.error(error);
	if (!data)
		return new Response('interaction not found', { status: 400 });

	const member = await getServerMember(data.server_id, data.user_id);
	if (!member)
		return new Response('member not found', { status: 400 });

	verify(data.interaction_token, data.server_id, user, member).catch(console.error);
	await supabase.from('mellow_signups').delete().eq('user_id', discordId);

	return new Response('great!', { status: 200 });
}