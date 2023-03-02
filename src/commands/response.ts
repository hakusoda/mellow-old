// deno-lint-ignore-file no-explicit-any
import { getFixedT } from 'i18next';
import type { Interaction, InteractionCallbackData } from 'discordeno';

export type Response = (payload: Interaction) => InteractionCallbackData
export function text(key: string, args?: any[]): Response {
	return payload => ({
		content: getT(payload)(key, args)
	});
}

function getT({ locale }: Interaction) {
	return getFixedT(locale, 'command');
}