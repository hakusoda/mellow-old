import type { Command } from '../mod.ts';
export default {
	global: true,
	execute: ({ locale }) => {
		return {
			content: `locale: ${locale}`
		};
	}
} satisfies Command