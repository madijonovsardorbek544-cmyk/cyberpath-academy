import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'uz' | 'ru';

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    dashboard: 'Dashboard', practice: 'Practice Hub', skillTree: 'Skill Tree', paths: 'Learning Paths', labs: 'Safe Labs', mistakes: 'Mistake Notebook', tutor: 'AI Tutor', billing: 'Billing', support: 'Support', mentor: 'Mentor', teacher: 'Teacher', admin: 'Admin', privacy: 'Privacy', terms: 'Terms', safety: 'Safety', signedInAs: 'Signed in as', logout: 'Logout', skipToContent: 'Skip to content', adaptive: 'Adaptive cyber learning', pricing: 'Pricing', login: 'Login', startLearning: 'Start learning', createAccount: 'Create account', viewPricing: 'View pricing', exploreCurriculum: 'Explore curriculum', free: 'Free', premium: 'Premium', locale: 'Language',
  },
  uz: {
    dashboard: 'Panel', practice: 'Mashq markazi', skillTree: 'Ko‘nikma daraxti', paths: 'Yoʻnalishlar', labs: 'Xavfsiz laboratoriyalar', mistakes: 'Xatolar daftari', tutor: 'AI ustoz', billing: 'Toʻlov', support: 'Yordam', mentor: 'Mentor', teacher: 'O‘qituvchi', admin: 'Admin', privacy: 'Maxfiylik', terms: 'Shartlar', safety: 'Xavfsizlik', signedInAs: 'Tizimga kirgan', logout: 'Chiqish', skipToContent: 'Kontentga o‘tish', adaptive: 'Moslashuvchan kiber taʼlim', pricing: 'Narxlar', login: 'Kirish', startLearning: 'O‘qishni boshlash', createAccount: 'Hisob yaratish', viewPricing: 'Narxlarni ko‘rish', exploreCurriculum: 'Dastur bilan tanishing', free: 'Bepul', premium: 'Premium', locale: 'Til',
  },
  ru: {
    dashboard: 'Панель', practice: 'Практика', skillTree: 'Дерево навыков', paths: 'Траектории', labs: 'Безопасные лаборатории', mistakes: 'Тетрадь ошибок', tutor: 'AI-наставник', billing: 'Оплата', support: 'Поддержка', mentor: 'Наставник', teacher: 'Учитель', admin: 'Админ', privacy: 'Конфиденциальность', terms: 'Условия', safety: 'Безопасность', signedInAs: 'Вход выполнен как', logout: 'Выйти', skipToContent: 'Перейти к содержимому', adaptive: 'Адаптивное кибер-обучение', pricing: 'Тарифы', login: 'Вход', startLearning: 'Начать обучение', createAccount: 'Создать аккаунт', viewPricing: 'Смотреть тарифы', exploreCurriculum: 'Изучить программу', free: 'Бесплатно', premium: 'Премиум', locale: 'Язык',
  }
};

export const demoLocaleNotice = 'Uzbek and Russian translations are still in review, so the public beta demo is locked to English for now.';

export const availableDemoLocales: Locale[] = ['en'];
const reportedMissingKeys = new Set<string>();
const missingTranslationKeys: string[] = [];

export function getMissingTranslationKeys() {
  return [...missingTranslationKeys];
}

export function resolveDemoLocale(value: unknown): Locale {
  return availableDemoLocales.includes(value as Locale) ? (value as Locale) : 'en';
}

export function translateDemoKey(locale: Locale, key: string) {
  const safeLocale = resolveDemoLocale(locale);
  const translated = dictionaries[safeLocale][key] ?? dictionaries.en[key];
  if (!translated && !reportedMissingKeys.has(key)) {
    reportedMissingKeys.add(key);
    missingTranslationKeys.push(`${safeLocale}:${key}`);
    if (import.meta.env?.DEV) console.warn(`Missing translation key: ${key}`);
  }
  return translated ?? key;
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void; t: (key: string) => string; localeNotice: string; availableLocales: Locale[]; } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveDemoLocale(localStorage.getItem('cyberpath-locale') || import.meta.env.VITE_DEFAULT_LOCALE));

  const setLocale = (value: Locale) => {
    setLocaleState(resolveDemoLocale(value));
  };

  useEffect(() => {
    localStorage.setItem('cyberpath-locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: string) => translateDemoKey(locale, key),
    localeNotice: demoLocaleNotice,
    availableLocales: availableDemoLocales
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
