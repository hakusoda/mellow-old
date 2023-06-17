// deno-lint-ignore-file no-explicit-any
import { getFixedT } from 'i18next';
import { editOriginalResponse } from '../discord.ts';
import type { InteractionCallbackData } from 'discordeno';

import type { DiscordInteraction } from '../types.ts';
export type Response = (payload: DiscordInteraction) => InteractionCallbackData
export function text(key: string, args?: any[]): Response {
	return payload => content(getT(payload)(key, args));
}

export function content(content: string, flags?: number) {
	return {
		flags,
		content
	};
}

export function defer(token: string, callback: () => Promise<any>, flags?: number) {
	callback().catch(error => {
		console.error(error);
		editOriginalResponse(token, content('an unexpected error occurred!'));
	});
	return { type: 5, data: { flags } };
}

function getT({ locale }: DiscordInteraction) {
	return getFixedT(locale, 'command');
}