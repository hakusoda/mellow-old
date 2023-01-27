import { t } from 'i18next';

import type { Command } from '../mod.ts';
export const ping: Command = {
	global: true,
	execute: () => {
		return {
			content: t('command:ping.content')
		}
	}
}