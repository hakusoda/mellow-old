import { camelize } from 'camelize';
import { json, serve, validateRequest } from 'sift';
import { Interaction, verifySignature, InteractionTypes, InteractionResponseTypes } from 'discordeno';

import './src/localization/mod.ts';
import { hasPermissionLevel } from './src/util/permissions.ts';
import { isInteractionResponse } from './src/util/mod.ts';
import { commands, registerGlobalCommands } from './src/commands/mod.ts';

serve({ '/': main });

async function main(request: Request) {
	const { error } = await validateRequest(request, {
		POST: {
			headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
		}
	});
	if (error)
		return json({ error: error.message }, { status: error.status });

	const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
	if (!publicKey)
		return json({
			error: 'missing public key',
		});

	const signature = request.headers.get('X-Signature-Ed25519')!;
	const timestamp = request.headers.get('X-Signature-Timestamp')!;

	const { body, isValid } = verifySignature({
		body: await request.text(),
		publicKey,
		signature,
		timestamp
	});
	if (!isValid)
		return json({ error: 'Invalid request; could not verify the request' }, {
			status: 401,
		});

	const payload = camelize<Interaction>(JSON.parse(body)) as Interaction;
	if (payload.type === InteractionTypes.Ping)
		return json({
			type: InteractionResponseTypes.Pong,
		});
	else if (payload.type === InteractionTypes.ApplicationCommand) {
		if (!payload.data?.name)
			return json({
				type: InteractionResponseTypes.ChannelMessageWithSource,
				data: {
					content: 'command name not provided 👎'
				}
			});

		const command = commands[payload.data.name];
		if (!command)
			return json({
				type: InteractionResponseTypes.ChannelMessageWithSource,
				data: {
					content: 'command not found 👎'
				}
			});

		if (!await hasPermissionLevel(command, payload))
			return json({
				type: InteractionResponseTypes.ChannelMessageWithSource,
				data: {
					content: 'you are not cool enough 🦑'
				}
			});

		const result = await command.execute(payload);
		if (!isInteractionResponse(result))
			return json({
				data: result,
				type: InteractionResponseTypes.ChannelMessageWithSource
			});

		return json(result);
	}

	return json({ error: 'Bad request' }, { status: 400 });
}

await registerGlobalCommands();