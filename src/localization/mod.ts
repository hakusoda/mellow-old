import i18n from 'i18next';

import jpCommand from './locales/ja/command.json' assert { type: 'json' };
import enCommand from './locales/en-US/command.json' assert { type: 'json' };

export const LOCALES = ['ja', 'en-US'];

await i18n
.init({
    resources: {
		ja: {
			command: jpCommand
		},
        'en-US': {
			command: enCommand
        }
    },
    lng: 'en-US',
    fallbackLng: 'en-US'
});