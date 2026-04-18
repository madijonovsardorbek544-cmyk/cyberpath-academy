import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Locale = 'en' | 'uz' | 'ru';

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    dashboard: 'Dashboard', practice: 'Practice Hub', paths: 'Learning Paths', labs: 'Safe Labs', mistakes: 'Mistake Notebook', tutor: 'AI Tutor', billing: 'Billing', support: 'Support', mentor: 'Mentor', admin: 'Admin', privacy: 'Privacy', terms: 'Terms', safety: 'Safety', signedInAs: 'Signed in as', logout: 'Logout', skipToContent: 'Skip to content', adaptive: 'Adaptive cyber learning', pricing: 'Pricing', login: 'Login', startLearning: 'Start learning', createAccount: 'Create account', viewPricing: 'View pricing', exploreCurriculum: 'Explore curriculum', free: 'Free', premium: 'Premium', locale: 'Language',
  },
  uz: {
    dashboard: 'Panel', practice: 'Mashq markazi', paths: 'Yoʻnalishlar', labs: 'Xavfsiz laboratoriyalar', mistakes: 'Xatolar daftari', tutor: 'AI ustoz', billing: 'Toʻlov', support: 'Yordam', mentor: 'Mentor', admin: 'Admin', privacy: 'Maxfiylik', terms: 'Shartlar', safety: 'Xavfsizlik', signedInAs: 'Tizimga kirgan', logout: 'Chiqish', skipToContent: 'Kontentga o‘tish', adaptive: 'Moslashuvchan kiber taʼlim', pricing: 'Narxlar', login: 'Kirish', startLearning: 'O‘qishni boshlash', createAccount: 'Hisob yaratish', viewPricing: 'Narxlarni ko‘rish', exploreCurriculum: 'Dastur bilan tanishing', free: 'Bepul', premium: 'Premium', locale: 'Til',
  },
  ru: {
    dashboard: 'Панель', practice: 'Практика', paths: 'Траектории', labs: 'Безопасные лаборатории', mistakes: 'Тетрадь ошибок', tutor: 'AI-наставник', billing: 'Оплата', support: 'Поддержка', mentor: 'Наставник', admin: 'Админ', privacy: 'Конфиденциальность', terms: 'Условия', safety: 'Безопасность', signedInAs: 'Вход выполнен как', logout: 'Выйти', skipToContent: 'Перейти к содержимому', adaptive: 'Адаптивное кибер-обучение', pricing: 'Тарифы', login: 'Вход', startLearning: 'Начать обучение', createAccount: 'Создать аккаунт', viewPricing: 'Смотреть тарифы', exploreCurriculum: 'Изучить программу', free: 'Бесплатно', premium: 'Премиум', locale: 'Язык',
  }
};

const LocaleContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void; t: (key: string) => string; } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('cyberpath-locale') as Locale) || ((import.meta.env.VITE_DEFAULT_LOCALE as Locale | undefined) ?? 'en'));

  useEffect(() => {
    localStorage.setItem('cyberpath-locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t: (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
