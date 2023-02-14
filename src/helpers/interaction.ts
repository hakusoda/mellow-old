import type { Embed } from 'discordeno';
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