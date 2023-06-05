import { validateRequest } from 'sift';
import { verifySignature, InteractionResponseTypes } from 'discordeno';

import { text } from '../commands/response.ts';
import { json, error } from './mod.ts';
import { hasPermission } from '../util/permissions.ts';
import { channelResponse } from '../helpers/interaction.ts';
import { DISCORD_PUBLIC_KEY } from '../util/constants.ts';
import { isInteractionResponse } from '../util/mod.ts';
import { DiscordInteractionType } from '../enums.ts';
import type { DiscordInteraction } from '../types.ts';
import { commands, processCommand } from '../commands/mod.ts';
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
			if (!payload.data?.name)
				return channelResponse(text('error.invalid_request')(payload));

			const command = commands[payload.data.name];
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