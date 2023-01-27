import i18n from 'i18next';

import enCommand from './locales/en/command.json' assert { type: 'json' };

await i18n
.init({
    resources: {
        en: {
			command: enCommand
        }
    },
    lng: 'en',
    fallbackLng: 'en'
});