import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Moon, Shield, Sun, LayoutDashboard, GraduationCap, FlaskConical, NotebookTabs, Brain, Users, Settings, LifeBuoy, CreditCard, Target } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { Button } from './ui';

const studentLinks = [
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/practice', key: 'practice', icon: Target },
  { to: '/paths', key: 'paths', icon: GraduationCap },
  { to: '/labs', key: 'labs', icon: FlaskConical },
  { to: '/mistakes', key: 'mistakes', icon: NotebookTabs },
  { to: '/tutor', key: 'tutor', icon: Brain },
  { to: '/billing', key: 'billing', icon: CreditCard },
  { to: '/support', key: 'support', icon: LifeBuoy }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const navigate = useNavigate();

  const roleLinks = user?.role === 'mentor'
    ? [...studentLinks, { to: '/mentor', key: 'mentor', icon: Users }]
    : user?.role === 'admin'
      ? [...studentLinks, { to: '/admin', key: 'admin', icon: Settings }, { to: '/mentor', key: 'mentor', icon: Users }]
      : studentLinks;

  return (
    <div className="min-h-screen bg-slate-950 bg-glow text-slate-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-sky-400 focus:px-4 focus:py-2 focus:text-slate-950">{t('skipToContent')}</a>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-800 bg-slate-950/80 p-4 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <Link to="/" className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-4">
            <div className="rounded-2xl bg-sky-400/20 p-3 text-sky-300"><Shield size={20} /></div>
            <div>
              <div className="font-semibold text-white">CyberPath Academy</div>
              <div className="text-xs text-slate-400">{t('adaptive')}</div>
            </div>
          </Link>
          <nav className="mt-6 grid gap-2" aria-label="Primary navigation">
            {roleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-sky-400/15 text-sky-200' : 'text-slate-300 hover:bg-slate-900'}`}>
                  <Icon size={18} />
                  {t(link.key)}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-6 grid gap-2 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300">{t('privacy')}</Link>
            <Link to="/terms" className="hover:text-slate-300">{t('terms')}</Link>
            <Link to="/safety" className="hover:text-slate-300">{t('safety')}</Link>
          </div>
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('signedInAs')}</p>
                <p className="text-sm font-medium text-white">{user?.name} · {user?.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="sr-only" htmlFor="locale-switcher">{t('locale')}</label>
                <select id="locale-switcher" aria-label={t('locale')} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'uz' | 'ru')}>
                  <option value="en">EN</option>
                  <option value="uz">UZ</option>
                  <option value="ru">RU</option>
                </select>
                <button className="rounded-2xl border border-slate-700 p-3" onClick={toggleTheme} aria-label="Toggle theme">
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <Button className="bg-slate-200 text-slate-950" onClick={async () => { await logout(); navigate('/'); }}>
                  {t('logout')}
                </Button>
              </div>
            </div>
          </header>
          <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
