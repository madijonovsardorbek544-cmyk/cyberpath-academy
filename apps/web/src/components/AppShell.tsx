import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Moon, Shield, Sun, LayoutDashboard, GraduationCap, FlaskConical, NotebookTabs, Brain, Users, Settings, LifeBuoy, CreditCard, Target, FileText, Network, ClipboardCheck, SearchCheck, Siren, Flame, CalendarDays, BadgeCheck, BriefcaseBusiness } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { PageBetaActions } from './BetaMode';
import { Button, Loader } from './ui';
import { showPricing } from '../api/client';

const studentLinks = [
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/beta-checklist', key: 'betaChecklist', icon: ClipboardCheck },
  { to: '/progress', key: 'progress', icon: Flame },
  { to: '/practice', key: 'practice', icon: Target },
  { to: '/skill-tree', key: 'skillTree', icon: Network },
  { to: '/paths', key: 'paths', icon: GraduationCap },
  { to: '/cases', key: 'cases', icon: SearchCheck },
  { to: '/soc', key: 'soc', icon: Siren },
  { to: '/event', key: 'event', icon: CalendarDays },
  { to: '/exam', key: 'exam', icon: BadgeCheck },
  { to: '/teams', key: 'teams', icon: Users },
  { to: '/jobs', key: 'jobs', icon: BriefcaseBusiness },
  { to: '/labs', key: 'labs', icon: FlaskConical },
  { to: '/portfolio', key: 'portfolio', icon: FileText },
  { to: '/mistakes', key: 'mistakes', icon: NotebookTabs },
  { to: '/tutor', key: 'tutor', icon: Brain },
  ...(showPricing ? [{ to: '/billing', key: 'billing', icon: CreditCard }] : []),
  { to: '/support', key: 'support', icon: LifeBuoy }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dark, toggleTheme } = useTheme();
  const { user, logout, loading } = useAuth();
  const { locale, setLocale, t, localeNotice } = useLocale();
  const navigate = useNavigate();

  const safeName = user?.name || 'New learner';
  const safeRole = user?.role || 'student';

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 bg-glow text-slate-100">
        <Loader text="Restoring your session..." />
      </div>
    );
  }

  const roleLinks = safeRole === 'mentor'
    ? [...studentLinks, { to: '/teacher', key: 'teacher', icon: Users }]
    : safeRole === 'admin'
      ? [...studentLinks, { to: '/admin', key: 'admin', icon: Settings }, { to: '/teacher', key: 'teacher', icon: Users }]
      : studentLinks;

  return (
    <div className="min-h-screen bg-slate-950 bg-glow text-slate-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-sky-400 focus:px-4 focus:py-2 focus:text-slate-950">{t('skipToContent')}</a>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-800 bg-slate-950/80 px-2 py-2 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-4">
          <Link to="/" className="hidden items-center gap-3 rounded-2xl bg-slate-900 px-4 py-4 lg:flex">
            <div className="rounded-2xl bg-sky-400/20 p-3 text-sky-300"><Shield size={20} /></div>
            <div>
              <div className="font-semibold text-white">CyberPath Academy</div>
              <div className="text-xs text-slate-400">{t('adaptive')}</div>
            </div>
          </Link>
          <nav className="flex gap-1 overflow-x-auto lg:mt-6 lg:grid lg:gap-2 lg:overflow-visible" aria-label="Primary navigation">
            {roleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex min-h-11 min-w-max items-center gap-2 rounded-2xl px-3 py-2 text-sm transition lg:gap-3 lg:px-4 lg:py-3 ${isActive ? 'bg-sky-400/15 text-sky-200' : 'text-slate-300 hover:bg-slate-900'}`}>
                  <Icon size={18} />
                  {link.key === 'betaChecklist' ? 'Beta checklist' : t(link.key)}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-6 hidden gap-2 text-xs text-slate-400 lg:grid">
            <Link to="/privacy" className="hover:text-slate-300">{t('privacy')}</Link>
            <Link to="/terms" className="hover:text-slate-300">{t('terms')}</Link>
            <Link to="/safety" className="hover:text-slate-300">{t('safety')}</Link>
          </div>
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-4 lg:px-8">
              <div className="min-w-0">
                <p className="hidden text-xs uppercase tracking-[0.25em] text-slate-400 sm:block">{t('signedInAs')}</p>
                <p className="truncate text-sm font-medium text-white"><Link to="/" className="lg:hidden" aria-label="CyberPath Academy home"><Shield size={16} className="mr-2 inline text-sky-300" /></Link>{safeName}<span className="hidden sm:inline"> · {safeRole}</span></p>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
                <Link to="/report-bug" className="hidden rounded-2xl border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-rose-400/10 sm:inline-flex">Report bug</Link>
                <Link to="/support" className="hidden rounded-2xl border border-sky-400/30 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-400/10 md:inline-flex">Give feedback</Link><Link to="/school-pilot" className="hidden rounded-2xl border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-400/10 lg:inline-flex">Request school pilot</Link>
                <label className="sr-only" htmlFor="locale-switcher">{t('locale')}</label>
                <select id="locale-switcher" aria-label={t('locale')} className="min-h-11 rounded-2xl border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 sm:px-3" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'uz' | 'ru')}>
                  <option value="en">EN</option>
                  <option value="uz">UZ</option>
                  <option value="ru">RU</option>
                </select>
                <span className="hidden max-w-[220px] text-xs text-slate-400 xl:inline" title={localeNotice}>UZ · RU beta</span>
                <button className="min-h-11 min-w-11 rounded-2xl border border-slate-700 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" onClick={toggleTheme} aria-label="Toggle theme">
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <Button className="bg-slate-200 px-3 text-sm text-slate-950 sm:px-4" onClick={async () => { await logout(); navigate('/'); }}>
                  {t('logout')}
                </Button>
              </div>
            </div>
          </header>
          <main id="main-content" className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}<PageBetaActions pageName={window.location.hash || window.location.pathname} /></main>
        </div>
      </div>
    </div>
  );
}
