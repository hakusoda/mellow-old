import i18n from 'i18next';

import enCommand from './locales/en-US/command.json' assert { type: 'json' };
import jpCommand from './locales/ja-JP/command.json' assert { type: 'json' };

await i18n
.init({
    resources: {
        'en-US': {
			command: enCommand
        },
		'ja-JP': {
			command: jpCommand
		}
    },
    lng: 'en-US',
    fallbackLng: 'en-US'
});