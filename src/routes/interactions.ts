import { validateRequest } from 'sift';
import { verifySignature, InteractionResponseTypes } from 'discordeno';

import { json, error } from './mod.ts';
import { text, defer } from '../commands/response.ts';
import { kv, supabase } from '../database.ts';
import { hasPermission } from '../util/permissions.ts';
import { channelResponse } from '../helpers/interaction.ts';
import { DISCORD_PUBLIC_KEY } from '../util/constants.ts';
import { editOriginalResponse } from '../discord.ts';
import { processCustomCommand } from '../commands/custom.ts';
import { isInteractionResponse } from '../util/mod.ts';
import type { DiscordInteraction } from '../types.ts';
import { commands, processCommand } from '../commands/mod.ts';
import { GlobalState, DiscordInteractionType } from '../enums.ts';
export default async (request: Request) => {
	const { error: validationError } = await validateRequest(request, {
		POST: {
			headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
		}
	});
	if (validationError)
		return error(validationError.message, validationError.status);

	const signature = request.headers.get('X-Signature-Ed25519')!;
	const timestamp = request.headers.get('X-Signature-Timestamp')!;

	const { body, isValid } = verifySignature({
		body: await request.text(),
		signature,
		timestamp,
		publicKey: DISCORD_PUBLIC_KEY
	});
	if (!isValid)
		return json({ error: 'invalid request signature' }, 401);

	const payload: DiscordInteraction = JSON.parse(body);
	switch (payload.type) {
		case DiscordInteractionType.Ping:
			return json({ type: InteractionResponseTypes.Pong });
		case DiscordInteractionType.ApplicationCommand: {
			if ((await kv.get(['global_state'])).value === GlobalState.Maintenance)
				return channelResponse(text('error.maintenance')(payload));
			if (!payload.data?.name)
				return channelResponse(text('error.invalid_request')(payload));

			const guildId = (payload.data as any).guild_id;
			if (guildId) {
				return json(defer(payload.token, async () => {
					const { data, error } = await supabase.from('mellow_server_commands').select('id, name, actions:mellow_server_command_actions ( id, type, data, position, parent_id, parent_type )').eq('name', payload.data.name).eq('server_id', guildId).limit(1).single();
					if (error) {
						console.error(error);
						return editOriginalResponse(payload.token, { content: 'command error ow!!!' });
					}

					await processCustomCommand(payload, data as any);
				}));
			}
			
			const command = commands[payload.data.name!];
			if (!command)
				return channelResponse(text('error.invalid_request')(payload));

			if (!await hasPermission(command, payload))
				return channelResponse(text('error.no_permission')(payload));

			const data = await processCommand(command, payload).catch(() =>
				text('error.unknown')(payload)
			);
			if (!isInteractionResponse(data))
				return channelResponse(data);

			return json(data);
		}
	}

	return error('bad request', 400);
}