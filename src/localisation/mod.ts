import i18n from 'i18next';

import jpCommon from './locales/ja/common.json' assert { type: 'json' };
import jpCommand from './locales/ja/command.json' assert { type: 'json' };
import jpLogging from './locales/ja/logging.json' assert { type: 'json' };

import enCommon from './locales/en-US/common.json' assert { type: 'json' };
import enCommand from './locales/en-US/command.json' assert { type: 'json' };
import enLogging from './locales/en-US/logging.json' assert { type: 'json' };

export const LOCALES = ['ja', 'en-US'];

await i18n.init({
    resources: {
		ja: {
			common: jpCommon,
			command: jpCommand,
			logging: jpLogging
		},
        'en-US': {
			common: enCommon,
			command: enCommand,
			logging: enLogging
        }
    },
    lng: 'en-US',
    fallbackLng: 'en-US'
});