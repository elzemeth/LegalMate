// TR: API YANITLARI İÇİN SUNUUC TARAFI ÇEVİRİ YARDIMI
// EN: TRANSLATION HELPERS FOR SERVER-SIDE ERROR HANDLING AND RESPONSES
import { translations, type Language, type ApiErrorKey } from '../i18n/translations';

export function getServerTranslation(lang: Language = 'tr') {
  return translations[lang];
}

export function getApiError(key: ApiErrorKey, lang: Language = 'tr') {
  return translations[lang].apiErrors[key];
}
