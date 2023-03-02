import { validateRequest } from 'sift';
import { Interaction, verifySignature, InteractionTypes, InteractionResponseTypes } from 'discordeno';

import { text } from '../commands/response.ts';
import { json, error } from './mod.ts';
import { hasPermission } from '../util/permissions.ts';
import { channelResponse } from '../helpers/interaction.ts';
import { isInteractionResponse } from '../util/mod.ts';
import { commands, processCommand } from '../commands/mod.ts';
export default async (request: Request) => {
	const { error: validationError } = await validateRequest(request, {
		POST: {
			headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
		}
	});
	if (validationError)
		return error(validationError.message, validationError.status);

	const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
	if (!publicKey)
		return error('missing public key', 500);

	const signature = request.headers.get('X-Signature-Ed25519')!;
	const timestamp = request.headers.get('X-Signature-Timestamp')!;

	const { body, isValid } = verifySignature({
		body: await request.text(),
		publicKey,
		signature,
		timestamp
	});
	if (!isValid)
		return json({ error: 'invalid request signature' }, 401);

	const payload: Interaction = JSON.parse(body);
	switch (payload.type) {
		case InteractionTypes.Ping:
			return json({ type: InteractionResponseTypes.Pong });
		case InteractionTypes.ApplicationCommand: {
			if (!payload.data?.name)
				return channelResponse(text('error.invalid_request')(payload));

			const command = commands[payload.data.name];
			if (!command)
				return channelResponse(text('error.invalid_request')(payload));

			if (!await hasPermission(command, payload))
				return channelResponse(text('error.no_permission')(payload));

			const data = await processCommand(command, payload);
			if (!isInteractionResponse(data))
				return channelResponse(data);

			return json(data);
		}
	}

	return error('bad request', 400);
}