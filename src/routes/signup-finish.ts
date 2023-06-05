import { getUser, supabase } from '../database.ts';
import { MELLOW_KEY } from '../util/constants.ts';
import { editOriginalResponse } from '../discord.ts';
export default async (request: Request) => {
	if (request.headers.get('x-api-key') !== MELLOW_KEY)
		return new Response('missing key', { status: 403 });

	const [userId, discordId] = (await request.text()).split(':');
	const user = await getUser(userId);
	if (!user)
		return new Response('invalid user', { status: 400 });

	const { data, error } = await supabase.from('mellow_signups').select('*').eq('user_id', discordId);
	if (error) {
		console.error(error);
		return new Response('interaction not found', { status: 400 });
	}

	await editOriginalResponse(data[0].interaction_token, {
		content: 'wow neat you signed up!!!\nrun /verify again, this is unfinished...',
		components: []
	});

	return new Response('great!', { status: 200 });
}