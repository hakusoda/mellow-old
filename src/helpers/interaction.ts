import { InteractionResponseTypes } from 'discordeno';
import type { Embed, InteractionCallbackData } from 'discordeno';

import { json } from '../routes/mod.ts';
export function embed(data: Embed) {
	return { embeds: [data] };
}

export function embed2(title: string, description: string, data: Embed) {
	return { embeds: [{
		title,
		description,
		...data
	}] };
}

export function channelResponse(data: InteractionCallbackData) {
	return json({
		data,
		type: InteractionResponseTypes.ChannelMessageWithSource
	});
}