import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { translations, defaultLocale, supportedLocales } from '../i18n/translations';

export const I18nContext = createContext();

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

const translate = (locale, key, params) => {
    const localeValue = getNestedValue(translations[locale], key);
    const fallbackValue = getNestedValue(translations[defaultLocale], key);
    const value = localeValue ?? fallbackValue ?? key;
    return formatText(value, params);
};

const getInitialLocale = () => {
    if (typeof window === 'undefined') return defaultLocale;
    const saved = window.localStorage.getItem('FLOW_AI_LOCALE');
    if (saved && supportedLocales.includes(saved)) {
        return saved;
    }
    return defaultLocale;
};

export const I18nProvider = ({ children }) => {
    const [locale, setLocaleState] = useState(getInitialLocale);

    const setLocale = useCallback((nextLocale) => {
        if (!supportedLocales.includes(nextLocale)) return;
        setLocaleState(nextLocale);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('FLOW_AI_LOCALE', nextLocale);
        }
    }, []);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
        }
    }, [locale]);

    const t = useMemo(() => (key, params) => translate(locale, key, params), [locale]);

    const value = useMemo(() => ({
        locale,
        setLocale,
        t,
        availableLocales: supportedLocales
    }), [locale, t, setLocale]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
