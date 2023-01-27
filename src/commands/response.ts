// deno-lint-ignore-file no-explicit-any
import { getFixedT } from 'i18next';
import type { Interaction } from 'discordeno';
import type { CommandResponse } from './mod.ts';

export type Response = (payload: Interaction) => CommandResponse
export function text(key: string, args?: any[]): Response {
	return payload => ({
		content: getT(payload)(key, args)
	});
}

function getT({ locale }: Interaction) {
	return getFixedT(locale, 'command');
}