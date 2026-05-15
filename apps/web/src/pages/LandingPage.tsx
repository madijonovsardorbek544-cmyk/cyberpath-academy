import { Link } from 'react-router-dom';
import { BadgeCheck, BookOpen, Building2, ChartNoAxesCombined, FileText, FlaskConical, Lock, Shield } from 'lucide-react';
import { Badge, Button, Card, SectionTitle } from '../components/ui';
import { useLocale } from '../contexts/LocaleContext';

const problems = ['Beginners get lost in scattered tools, random videos, and unclear roadmaps.', 'Too much online “hacking” content skips ethics, authorization, and defensive reasoning.', 'Schools and learning centers often lack safe practical cyber labs for teenagers and new learners.'];
const solutions = [
  { title: 'Structured roadmap', copy: 'Beginner-first paths with quizzes, review loops, and role readiness signals.', icon: BookOpen },
  { title: 'Defensive labs', copy: 'Fictional datasets for triage, access review, password policy audit, and toy secure-code review.', icon: FlaskConical },
  { title: 'Proof-of-work', copy: 'Learners turn labs into incident reports, memos, risk registers, and portfolio artifacts.', icon: FileText },
  { title: 'Mentor dashboards', copy: 'Teachers assign work, see weak areas, review artifacts, and export simple reports.', icon: ChartNoAxesCombined }
];
const labExamples = ['Phishing triage', 'Suspicious login review', 'Password policy audit', 'Access review', 'Incident report writing', 'Secure code review for toy snippets'];
const plans = [
  { name: 'Free', copy: 'Limited beginner lessons, starter quizzes and labs, basic dashboard, and mistake notebook.', cta: 'Start Free' },
  { name: 'Premium', copy: 'All lessons and labs, guided tutor, certificates, guided projects, portfolio publishing, and full analytics.', cta: 'View Premium' },
  { name: 'School / Cohort', copy: 'Premium plus mentor workflows, cohort dashboard, assignments, student reports, CSV exports, and cohort analytics.', cta: 'Request Demo' }
];

export function LandingPage() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="min-h-screen bg-slate-950 bg-glow text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/75 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/20 p-3 text-sky-300"><Shield size={20} /></div>
            <div><p className="font-semibold text-white">CyberPath Academy</p><p className="text-xs text-slate-400">Defensive cyber learning for students and schools</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label={t('locale')} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'uz' | 'ru')}><option value="en">EN</option><option value="uz">UZ</option><option value="ru">RU</option></select>
            <Link className="text-sm text-slate-300" to="/pricing">{t('pricing')}</Link>
            <Link className="text-sm text-slate-300" to="/login">{t('login')}</Link>
            <Link to="/login"><Button className="bg-sky-400 text-slate-950">Start Free</Button></Link>
          </div>
        </header>

        <section className="grid gap-8 py-16 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">Safe · Defensive-only · Beginner-ready · Uzbek/English learner friendly</Badge>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Learn defensive cybersecurity safely with lessons, labs, artifacts, and mentors.</h1>
            <p className="max-w-2xl text-lg text-slate-300">CyberPath Academy helps beginner students and schools learn defensive cybersecurity safely through structured lessons, safe labs, portfolio artifacts, and mentor dashboards.</p>
            <div className="flex flex-wrap gap-3"><Link to="/login"><Button className="bg-sky-400 text-slate-950">Start Free</Button></Link><Link to="/pricing"><Button className="border border-slate-700 bg-slate-900 text-white">Explore School Plan / Request Demo</Button></Link></div>
            <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3"><span className="flex items-center gap-2"><Lock size={16} /> Fictional data only</span><span className="flex items-center gap-2"><BadgeCheck size={16} /> Authorized practice</span><span className="flex items-center gap-2"><Shield size={16} /> Defensive-only</span></div>
          </div>
          <Card className="p-6">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5"><p className="text-sm font-semibold text-emerald-100">For students</p><p className="mt-2 text-slate-300">Learn fundamentals, practice defensive reasoning, build safe proof-of-work, and prepare for university or early cyber career paths.</p></div>
            <div className="mt-4 rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5"><p className="text-sm font-semibold text-sky-100">For schools and learning centers</p><p className="mt-2 text-slate-300">Assign lessons and labs, track progress, identify weak areas, review portfolios, and export reports.</p></div>
          </Card>
        </section>

        <section className="space-y-8 py-10"><SectionTitle eyebrow="Problem" title="Cybersecurity education needs safer structure." subtitle="CyberPath avoids unsafe hype and gives new learners a practical defensive loop." /><div className="grid gap-4 md:grid-cols-3">{problems.map((item) => <Card key={item} className="p-5 text-sm text-slate-300">{item}</Card>)}</div></section>
        <section className="space-y-8 py-10"><SectionTitle eyebrow="Solution" title="A full beginner-to-mentor learning workflow." subtitle="Lessons, quizzes, labs, artifacts, dashboards, and feedback signals work together instead of living in separate tools." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{solutions.map((item) => { const Icon = item.icon; return <Card key={item.title} className="p-5"><div className="w-fit rounded-2xl bg-sky-400/15 p-3 text-sky-300"><Icon size={20} /></div><h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm text-slate-400">{item.copy}</p></Card>; })}</div></section>
        <section className="grid gap-5 py-10 lg:grid-cols-2"><Card className="p-6"><SectionTitle eyebrow="Student outcomes" title="What learners should be able to show." /><ul className="mt-4 space-y-3 text-sm text-slate-300"><li>• Explain cyber fundamentals in plain language.</li><li>• Practice defensive reasoning with evidence from fictional datasets.</li><li>• Build safe incident reports, triage notes, audits, and memos.</li><li>• Prepare for university, competitions, internships, or early SOC/GRC/AppSec paths.</li></ul></Card><Card className="p-6"><SectionTitle eyebrow="School / cohort" title="Teacher workflow for safer cyber practice." /><ul className="mt-4 space-y-3 text-sm text-slate-300"><li>• Assign lessons, labs, and guided projects.</li><li>• Track student progress, weak topics, and inactivity alerts.</li><li>• Review portfolio artifacts and mentor feedback.</li><li>• Export student reports for learning centers and school programs.</li></ul></Card></section>
        <section className="space-y-8 py-10"><SectionTitle eyebrow="Safe lab examples" title="Practical without crossing safety boundaries." subtitle="Every lab uses toy scenarios, fictional data, and authorization reminders." /><div className="flex flex-wrap gap-3">{labExamples.map((item) => <Badge key={item} className="border-slate-700 bg-slate-900 px-4 py-2 text-slate-200">{item}</Badge>)}</div></section>
        <section className="space-y-8 py-10"><SectionTitle eyebrow="Pricing" title="A clear path from free learner access to school cohorts." /><div className="grid gap-5 md:grid-cols-3">{plans.map((plan) => <Card key={plan.name} className="p-6"><h3 className="text-xl font-semibold text-white">{plan.name}</h3><p className="mt-3 min-h-24 text-sm text-slate-400">{plan.copy}</p><Link to="/pricing"><Button className="mt-5 w-full bg-sky-400 text-slate-950">{plan.cta}</Button></Link></Card>)}</div></section>
        <section className="grid gap-5 py-10 lg:grid-cols-[0.85fr,1.15fr]"><Card className="border-emerald-400/20 bg-emerald-400/10 p-6"><Shield className="text-emerald-200" /><h2 className="mt-4 text-2xl font-semibold text-white">Safety statement</h2><p className="mt-3 text-sm text-emerald-50">CyberPath is defensive-only. Labs use fictional data only, teach authorized practice only, and redirect unsafe requests toward detection, prevention, documentation, and incident response.</p></Card><Card className="p-6"><h2 className="text-2xl font-semibold text-white">Beta honesty</h2><p className="mt-3 text-slate-300">Beta learner feedback coming soon. We do not use fake testimonials or inflated maturity claims. Public launch still needs validation, accessibility review, real payments, email delivery, monitoring, backups, privacy review, and school pilots.</p></Card></section>
        <section className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-8 text-center"><Building2 className="mx-auto text-sky-200" /><h2 className="mt-4 text-3xl font-semibold text-white">Ready to try a safer cyber learning path?</h2><p className="mx-auto mt-3 max-w-2xl text-slate-300">Start free as a learner or explore a school/cohort demo for mentors and learning centers.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/login"><Button className="bg-sky-400 text-slate-950">Start Free</Button></Link><Link to="/pricing"><Button className="border border-slate-700 bg-slate-900 text-white">Request Demo</Button></Link></div></section>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 py-8 text-sm text-slate-400"><p>CyberPath Academy is beta defensive cybersecurity education software.</p><div className="flex flex-wrap gap-4"><Link to="/pricing">Pricing</Link><Link to="/support">Support</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/safety">Safety</Link></div></footer>
      </div>
    </div>
  );
}
