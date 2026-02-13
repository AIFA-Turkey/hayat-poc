import { translations, defaultLocale, supportedLocales } from './translations';

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const formatText = (value, params) => {
  if (typeof value !== 'string') return value;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  ));
};

const getStoredLocale = () => {
  if (typeof window === 'undefined') return defaultLocale;
  const saved = window.localStorage.getItem('FLOW_AI_LOCALE');
  if (saved && supportedLocales.includes(saved)) {
    return saved;
  }
  return defaultLocale;
};

export const tStatic = (key, params, localeOverride) => {
  const locale = localeOverride || getStoredLocale();
  const localeValue = getNestedValue(translations[locale], key);
  const fallbackValue = getNestedValue(translations[defaultLocale], key);
  const value = localeValue ?? fallbackValue ?? key;
  return formatText(value, params);
};
