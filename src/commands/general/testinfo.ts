import type { Command } from '../mod.ts';
export const testInfo: Command = {
	global: true,
	execute: ({ locale }) => {
		return {
			content: `locale: ${locale}`
		};
	}
}