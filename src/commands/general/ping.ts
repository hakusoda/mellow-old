import type { Command } from '../mod.ts';
export default {
	global: true,
	execute: (_, t) => {
		return {
			content: t('ping.content')
		};
	}
} satisfies Command