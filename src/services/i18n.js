// src/services/i18n.js - locales klasöründeki dosyaları kullanır
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dil dosyalarını import et
import tr from '../locales/tr.json';
import en from '../locales/en.json';
import srp from '../locales/srp.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  srp: { translation: srp }
};

export const changeLanguage = async (lang) => {
  await AsyncStorage.setItem('app_language', lang);
  i18n.changeLanguage(lang);
  console.log('✅ Dil değiştirildi:', lang);
};

export const getCurrentLanguage = () => i18n.language;

export const getStoredLanguage = async () => {
  return await AsyncStorage.getItem('app_language');
};

const initI18n = async () => {
  let savedLang = await AsyncStorage.getItem('app_language');
  if (!savedLang) savedLang = 'tr';

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLang,
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });
  console.log('✅ i18n başlatıldı, dil:', savedLang);
};

initI18n();

export default i18n;