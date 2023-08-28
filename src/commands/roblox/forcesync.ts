import { command } from '../mod.ts';
import { defer, content } from '../response.ts';
import { editOriginalResponse } from '../../discord.ts';

import { verify } from './sync.ts';
import { getServer } from '../../database.ts';
import { getUserByDiscordId } from '../../database.ts';
import { DiscordMessageFlag, DiscordApplicationCommandOptionType } from '../../enums.ts';
export default command(({ t, token, member, guild_id }, { target, as }) => defer(token, async () => {
	const server = await getServer(guild_id);
	if (!server)
		return editOriginalResponse(token, content(t('sync.no_server')));

	if (!server.allow_forced_syncing)
		return editOriginalResponse(token, content(t('forcesync.disabled', [server])));

	const user = await getUserByDiscordId((target as any).user.id as any);
	if (user || as || server.sync_unknown_users)
		return verify(t, member, server, token, guild_id, user, target as any, as as any);

	return editOriginalResponse(token, content('user is not real'));
}, DiscordMessageFlag.Ephemeral), {
	options: [{
		name: 'target',
		type: DiscordApplicationCommandOptionType.User,
		required: true,
		description: 'Member to forcefully sync'
	}, {
		name: 'as',
		type: DiscordApplicationCommandOptionType.Integer,
		required: false,
		description: 'Roblox User to sync as'
	}] as const,
	defaultMemberPermissions: '0'
});