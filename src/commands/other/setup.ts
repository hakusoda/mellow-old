import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { DiscordMessageFlag } from '../../enums.ts';
import { getUserByDiscordId } from '../../database.ts';
import { supabase, getServer } from '../../database.ts';
export default command(({ t, token, member, guild_id }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (server)
		return editOriginalResponse(token, content(t('setup.exists', [guild_id])));

	const user = await getUserByDiscordId(member!.user.id);
	if (!user)
		return editOriginalResponse(token, {
			flags: DiscordMessageFlag.Ephemeral,
			content: t('setup.signup')
		});

	const response = await supabase.from('mellow_servers').insert({
		id: guild_id,
		name: guild_id
	});
	if (response.error) {
		console.error(response.error);
		return editOriginalResponse(token, content(t('error.database')));
	}

	const response2 = await supabase.from('mellow_server_members').insert({
		user_id: user.id,
		server_id: guild_id
	});
	if (response2.error) {
		console.error(response2.error);
		return editOriginalResponse(token, content(t('error.database')));
	}

	return editOriginalResponse(token, content(t('setup.done', [guild_id])));
}, DiscordMessageFlag.Ephemeral));