import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pl from '../locales/pl.json';
import en from '../locales/en.json';

const resources = {
  pl: {
    translation: pl
  },
  en: {
    translation: en
  }
};

// Resources loaded successfully

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl',
    supportedLngs: ['pl', 'en'],
    load: 'languageOnly',
    debug: false,

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'flightai-language',
    },

    react: {
      useSuspense: false
    }
  });

// Store language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('flightai-language', lng);
  document.documentElement.lang = lng;
});

export default i18n;