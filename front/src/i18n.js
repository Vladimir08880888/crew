/*
 * Internationalisation FR/EN.
 *
 * Approche :
 *  - Détection automatique de la langue du navigateur au premier chargement,
 *    avec fallback sur le français.
 *  - Choix sauvegardé en localStorage sous la clé « reminder_lang ».
 *  - Stratégie de fallback : si une clé manque dans une langue, on retombe
 *    sur le français (langue de référence du projet).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    interpolation: { escapeValue: false },   // React échappe déjà
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'reminder_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
