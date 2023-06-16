import i18n from 'i18next';

import jpCommon from './locales/ja/common.json' assert { type: 'json' };
import jpCommand from './locales/ja/command.json' assert { type: 'json' };

import enCommon from './locales/en-US/common.json' assert { type: 'json' };
import enCommand from './locales/en-US/command.json' assert { type: 'json' };

export const LOCALES = ['ja', 'en-US'];

await i18n.init({
    resources: {
		ja: {
			common: jpCommon,
			command: jpCommand
		},
        'en-US': {
			common: enCommon,
			command: enCommand
        }
    },
    lng: 'en-US',
    fallbackLng: 'en-US'
});