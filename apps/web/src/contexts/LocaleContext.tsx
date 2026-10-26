import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'uz' | 'ru';

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    dashboard: 'Dashboard', practice: 'Practice Hub', skillTree: 'Skill Tree', paths: 'Learning Paths', labs: 'Safe Labs', cases: 'Investigations', soc: 'SOC Simulator', event: '12 Days of Defense', exam: 'Analyst exam', phase: 'Phase', lessonObjectives: 'Learning objectives', lessonExamples: 'Examples', lessonChecks: 'Quick knowledge checks', lessonCheatSheet: 'Cheat sheet', lessonMistakes: 'Common mistakes', lessonWhy: 'Why this matters in real work', progress: 'Streak & League', mistakes: 'Mistake Notebook', tutor: 'AI Tutor', billing: 'Billing', support: 'Support', mentor: 'Mentor', teacher: 'Teacher', admin: 'Admin', privacy: 'Privacy', terms: 'Terms', safety: 'Safety', signedInAs: 'Signed in as', logout: 'Logout', skipToContent: 'Skip to content', adaptive: 'Adaptive cyber learning', pricing: 'Pricing', login: 'Login', startLearning: 'Start learning', createAccount: 'Create account', viewPricing: 'View pricing', exploreCurriculum: 'Explore curriculum', free: 'Free', premium: 'Premium', locale: 'Language',
  },
  uz: {
    dashboard: 'Panel', practice: 'Mashq markazi', skillTree: 'Ko‘nikma daraxti', paths: 'Yoʻnalishlar', labs: 'Xavfsiz laboratoriyalar', cases: 'Tergovlar', soc: 'SOC simulyatori', event: 'Himoyaning 12 kuni', exam: 'Tahlilchi imtihoni', phase: 'Bosqich', lessonObjectives: 'Dars maqsadlari', lessonExamples: 'Misollar', lessonChecks: 'Tezkor tekshiruv savollari', lessonCheatSheet: 'Qisqa eslatma', lessonMistakes: 'Keng tarqalgan xatolar', lessonWhy: 'Bu real ishda nega muhim', progress: 'Seriya va liga', mistakes: 'Xatolar daftari', tutor: 'AI ustoz', billing: 'Toʻlov', support: 'Yordam', mentor: 'Mentor', teacher: 'O‘qituvchi', admin: 'Admin', privacy: 'Maxfiylik', terms: 'Shartlar', safety: 'Xavfsizlik', signedInAs: 'Tizimga kirgan', logout: 'Chiqish', skipToContent: 'Kontentga o‘tish', adaptive: 'Moslashuvchan kiber taʼlim', pricing: 'Narxlar', login: 'Kirish', startLearning: 'O‘qishni boshlash', createAccount: 'Hisob yaratish', viewPricing: 'Narxlarni ko‘rish', exploreCurriculum: 'Dastur bilan tanishing', free: 'Bepul', premium: 'Premium', locale: 'Til',
  },
  ru: {
    dashboard: 'Панель', practice: 'Практика', skillTree: 'Дерево навыков', paths: 'Траектории', labs: 'Безопасные лаборатории', cases: 'Расследования', soc: 'Симулятор SOC', event: '12 дней защиты', exam: 'Экзамен аналитика', phase: 'Этап', lessonObjectives: 'Цели урока', lessonExamples: 'Примеры', lessonChecks: 'Быстрые вопросы для проверки', lessonCheatSheet: 'Шпаргалка', lessonMistakes: 'Частые ошибки', lessonWhy: 'Почему это важно в реальной работе', progress: 'Серия и лига', mistakes: 'Тетрадь ошибок', tutor: 'AI-наставник', billing: 'Оплата', support: 'Поддержка', mentor: 'Наставник', teacher: 'Учитель', admin: 'Админ', privacy: 'Конфиденциальность', terms: 'Условия', safety: 'Безопасность', signedInAs: 'Вход выполнен как', logout: 'Выйти', skipToContent: 'Перейти к содержимому', adaptive: 'Адаптивное кибер-обучение', pricing: 'Тарифы', login: 'Вход', startLearning: 'Начать обучение', createAccount: 'Создать аккаунт', viewPricing: 'Смотреть тарифы', exploreCurriculum: 'Изучить программу', free: 'Бесплатно', premium: 'Премиум', locale: 'Язык',
  }
};

export const demoLocaleNotice = 'Navigation and the free Foundations lessons are available in Uzbek and Russian. Other pages are still in English while translations are reviewed.';

export const availableDemoLocales: Locale[] = ['en', 'uz', 'ru'];
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
