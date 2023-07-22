import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { verify } from './sync.ts';
import { getServer } from '../../database.ts';
import { getUserByDiscordId } from '../../database.ts';
import { DiscordMessageFlag, DiscordApplicationCommandOptionType } from '../../enums.ts';
export default command(({ t, token, member, guild_id }, { target }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('verify.no_server')));

	const user = await getUserByDiscordId(target.user.id as any);
	if (user)
		return verify(t, member, server, token, guild_id, user, target);

	return editOriginalResponse(token, content('user is not real'));
}, DiscordMessageFlag.Ephemeral), {
	options: [{
		name: 'target',
		type: DiscordApplicationCommandOptionType.User,
		required: true,
		description: 'Member to forcefully sync'
	}] as const,
	defaultMemberPermissions: '0'
});