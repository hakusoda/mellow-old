// deno-lint-ignore-file no-explicit-any
import { getFixedT } from 'i18next';
import type { InteractionCallbackData } from 'discordeno';

import type { DiscordInteraction } from '../types.ts';
export type Response = (payload: DiscordInteraction) => InteractionCallbackData
export function text(key: string, args?: any[]): Response {
	return payload => content(getT(payload)(key, args));
}

export function content(content: string) {
	return { content };
}

export function defer(callback: () => void) {
	callback();
	return { type: 5 };
}

function getT({ locale }: DiscordInteraction) {
	return getFixedT(locale, 'command');
}