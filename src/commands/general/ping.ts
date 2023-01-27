import type { Command } from '../mod.ts';
export const ping: Command = {
	global: true,
	execute: (_, t) => {
		return {
			content: t('ping.content')
		};
	}
}