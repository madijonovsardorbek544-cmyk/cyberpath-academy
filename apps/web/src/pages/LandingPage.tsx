import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, BookOpen, Building2, ChartNoAxesCombined, ClipboardCheck, DollarSign, FileText, FlaskConical, Globe2, Lock, Shield, Users } from 'lucide-react';
import { Badge, Button, Card, Input, SectionTitle, Select, Textarea } from '../components/ui';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth } from '../contexts/AuthContext';
import { api, isMockApiMode } from '../api/client';

const demoAccounts = {
  student: { email: 'student@cyberpath.local', password: 'Student123!', target: '/dashboard' },
  mentor: { email: 'mentor@cyberpath.local', password: 'Mentor123!', target: '/mentor' },
  admin: { email: 'admin@cyberpath.local', password: 'Admin123!', target: '/admin' }
} as const;

const schoolNeeds = [
  'Teenagers need practical cyber education that does not point them at real targets or unsafe workflows.',
  'Teachers need visibility into progress, weak topics, lab quality, and who is falling behind.',
  'School leaders need exportable evidence, clear safety language, and a realistic price model before approving a pilot.'
];

const studentOutputs = ['Incident report', 'Phishing triage note', 'Access review memo', 'Password policy audit', 'Secure coding review', 'Cloud IAM review', 'Risk register', 'Executive summary'];

const pricing = [
  { name: 'Free', price: '$0', copy: 'Starter lessons, starter safe labs, basic progress, and mistake notebook for access-friendly markets.', features: ['Cyber foundations', 'Starter labs', 'Basic progress'] },
  { name: 'Premium Student', price: '$3/mo target', copy: 'All lessons/labs, certificates, portfolio publishing, guided projects, and guided help after validation.', features: ['All labs', 'Certificates', 'Portfolio publishing'] },
  { name: 'School / Cohort', price: '$300–$2,000/yr target', copy: 'Mentor dashboard, assignments, cohort analytics, reports, CSV exports, portfolio review, and admin controls.', features: ['Cohort dashboard', 'Student reports', 'Pilot support'] }
];

export function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [waitlist, setWaitlist] = useState({ name: '', email: '', role: 'teacher', organization: '', countryCity: '', studentCount: '', interestLevel: 'school pilot', message: '' });
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const enterDemo = async (role: keyof typeof demoAccounts) => {
    setDemoLoading(role);
    const account = demoAccounts[role];
    try {
      await api.post('/platform/analytics/event', { eventName: 'demo_role_selected', role });
      await login(account.email, account.password);
      navigate(account.target);
    } finally {
      setDemoLoading(null);
    }
  };

  const submitWaitlist = async (event: FormEvent) => {
    event.preventDefault();
    const response = await api.post<{ message: string }>('/platform/waitlist', {
      ...waitlist,
      studentCount: waitlist.studentCount ? Number(waitlist.studentCount) : null
    });
    setWaitlistMessage(response.message);
    setWaitlist({ name: '', email: '', role: 'teacher', organization: '', countryCity: '', studentCount: '', interestLevel: 'school pilot', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-glow text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/75 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/20 p-3 text-sky-300"><Shield size={20} /></div>
            <div><p className="font-semibold text-white">CyberPath Academy</p><p className="text-xs text-slate-400">Safe defensive cyber learning for schools and beginners</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label={t('locale')} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'uz' | 'ru')}><option value="en">EN</option><option value="uz">UZ</option><option value="ru">RU</option></select>
            <Link className="text-sm text-slate-300" to="/pricing">{t('pricing')}</Link>
            <Link className="text-sm text-slate-300" to="/support">Pilot form</Link>
            <Link className="text-sm text-slate-300" to="/login">{t('login')}</Link>
          </div>
        </header>

        <section className="grid gap-8 py-16 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">Defensive-only · Fictional labs · Mentor dashboards · Uzbek/English friendly</Badge>
            <h1 className="max-w-5xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Cybersecurity education schools can actually trust.</h1>
            <p className="max-w-3xl text-lg text-slate-300">CyberPath Academy helps schools and beginner students learn defensive cybersecurity safely through structured lessons, fictional labs, portfolio artifacts, mentor dashboards, and measurable role readiness.</p>
            <div className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-50">
              Public demo notice: this GitHub Pages build uses simulated frontend data. Use the buttons below to preview the student, mentor, and admin experience without creating accounts.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button className="bg-sky-400 text-slate-950" disabled={!!demoLoading} onClick={() => enterDemo('student')}>{demoLoading === 'student' ? 'Opening...' : 'Try Student Demo'}</Button>
              <Button className="border border-emerald-400/40 bg-emerald-400/10 text-emerald-100" disabled={!!demoLoading} onClick={() => enterDemo('mentor')}>{demoLoading === 'mentor' ? 'Opening...' : 'Try Mentor Demo'}</Button>
              <Button className="border border-violet-400/40 bg-violet-400/10 text-violet-100" disabled={!!demoLoading} onClick={() => enterDemo('admin')}>{demoLoading === 'admin' ? 'Opening...' : 'Try Admin Demo'}</Button>
            </div>
            <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3"><span className="flex items-center gap-2"><Lock size={16} /> Fictional data only</span><span className="flex items-center gap-2"><BadgeCheck size={16} /> Authorized practice</span><span className="flex items-center gap-2"><Shield size={16} /> No real-target hacking</span></div>
          </div>
          <Card className="p-6">
            <div className="grid gap-4">
              {[{ label: 'Student', value: 'Clear next action, weak topics, daily quest, next lab, portfolio suggestion.' }, { label: 'Mentor', value: 'Cohort overview, at-risk students, assignments, reports, portfolio evidence review.' }, { label: 'Admin', value: 'Beta operations, content quality, feedback, subscriptions, waitlist, platform health.' }].map((item) => <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5"><p className="text-sm font-semibold text-white">{item.label} demo</p><p className="mt-2 text-sm text-slate-400">{item.value}</p></div>)}
            </div>
          </Card>
        </section>

        <section className="space-y-8 py-10" id="why-schools-need-this"><SectionTitle eyebrow="Why schools need this" title="Cyber clubs need safe structure, not random hacking tutorials." subtitle="The product is designed around trust, teacher visibility, and portfolio proof instead of unsafe novelty." /><div className="grid gap-4 md:grid-cols-3">{schoolNeeds.map((item) => <Card key={item} className="p-5 text-sm text-slate-300">{item}</Card>)}</div></section>

        <section className="grid gap-5 py-10 lg:grid-cols-2">
          <Card className="p-6"><SectionTitle eyebrow="What students produce" title="Proof-of-work artifacts, not just completion badges." /><div className="mt-4 flex flex-wrap gap-2">{studentOutputs.map((item) => <Badge key={item} className="border-slate-700 bg-slate-900 px-3 py-2 text-slate-200">{item}</Badge>)}</div><p className="mt-4 text-sm text-slate-400">Every artifact is written from fictional evidence and scored for evidence quality, risk reasoning, clarity, defensive recommendations, professionalism, and safety awareness.</p></Card>
          <Card className="border-emerald-400/20 bg-emerald-400/10 p-6"><Shield className="text-emerald-200" /><SectionTitle eyebrow="Safe labs, not unsafe hacking" title="Defensive simulations with toy data only." /><p className="mt-3 text-sm text-emerald-50">Labs teach triage, review, documentation, escalation, risk reduction, and communication. They do not teach credential theft, live-target exploitation, malware, persistence, evasion, bypassing, or unauthorized workflows.</p></Card>
        </section>

        <section className="space-y-8 py-10"><SectionTitle eyebrow="School/cohort dashboard" title="A teacher operating system for beginner cyber practice." subtitle="Cohort analytics turn a demo into a product a school can evaluate." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[
          { title: 'Cohort analytics', copy: 'Total students, active this week, quiz accuracy, labs submitted, weak topics, and assignment due dates.', icon: ChartNoAxesCombined },
          { title: 'Student reports', copy: 'Goal, path, completed lessons, quiz average, strongest/weakest topics, artifacts, and recommended next step.', icon: ClipboardCheck },
          { title: 'Mentor workflow', copy: 'Assignments, alerts, feedback, at-risk students, evidence review, and exportable CSV reporting.', icon: Users },
          { title: 'Content governance', copy: 'Draft/reviewed/published/needs-update status so schools see curriculum quality discipline.', icon: BookOpen }
        ].map((item) => { const Icon = item.icon; return <Card key={item.title} className="p-5"><div className="w-fit rounded-2xl bg-sky-400/15 p-3 text-sky-300"><Icon size={20} /></div><h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm text-slate-400">{item.copy}</p></Card>; })}</div></section>

        <section className="grid gap-5 py-10 lg:grid-cols-[0.85fr,1.15fr]">
          <Card className="p-6"><SectionTitle eyebrow="Portfolio proof" title="The moat is evidence students can show." /><p className="mt-3 text-sm text-slate-300">CyberPath turns safe lab submissions into mentor-reviewable artifacts. Public links expose only read-only student-safe summaries, never private lab answers or sensitive data.</p><Link to="/public/artifacts/demo-phishing-brief"><Button className="mt-5 border border-slate-700 bg-slate-900 text-white">View sample public artifact</Button></Link></Card>
          <Card className="p-6"><SectionTitle eyebrow="Pricing model: Free, Premium, School" title="Monetization path without collecting cards in the demo." /><div className="mt-4 grid gap-4 md:grid-cols-3">{pricing.map((plan) => <div key={plan.name} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-white">{plan.name}</h3><DollarSign className="text-sky-300" size={18} /></div><p className="mt-1 text-sm text-sky-200">{plan.price}</p><p className="mt-2 text-xs text-slate-400">{plan.copy}</p><div className="mt-3 flex flex-wrap gap-2">{plan.features.map((feature) => <Badge key={feature}>{feature}</Badge>)}</div></div>)}</div><Link to="/pricing"><Button className="mt-5 bg-sky-400 text-slate-950">Explore pricing details</Button></Link></Card>
        </section>

        <section className="grid gap-5 py-10 lg:grid-cols-[1fr,0.9fr]">
          <Card className="p-6"><SectionTitle eyebrow="Public beta waitlist / school pilot" title="Help validate if this should become a real school product." subtitle="This pipeline matters more than adding random features." />{waitlistMessage ? <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{waitlistMessage}</div> : null}<form className="mt-5 grid gap-3" onSubmit={submitWaitlist}><div className="grid gap-3 sm:grid-cols-2"><Input required placeholder="Name" value={waitlist.name} onChange={(e) => setWaitlist({ ...waitlist, name: e.target.value })} /><Input required type="email" placeholder="Email" value={waitlist.email} onChange={(e) => setWaitlist({ ...waitlist, email: e.target.value })} /></div><div className="grid gap-3 sm:grid-cols-2"><Select value={waitlist.role} onChange={(e) => setWaitlist({ ...waitlist, role: e.target.value })}>{['student', 'parent', 'teacher', 'mentor', 'school owner', 'learning center'].map((role) => <option key={role}>{role}</option>)}</Select><Input placeholder="School / organization" value={waitlist.organization} onChange={(e) => setWaitlist({ ...waitlist, organization: e.target.value })} /></div><div className="grid gap-3 sm:grid-cols-3"><Input placeholder="Country / city" value={waitlist.countryCity} onChange={(e) => setWaitlist({ ...waitlist, countryCity: e.target.value })} /><Input type="number" min="0" placeholder="# students" value={waitlist.studentCount} onChange={(e) => setWaitlist({ ...waitlist, studentCount: e.target.value })} /><Select value={waitlist.interestLevel} onChange={(e) => setWaitlist({ ...waitlist, interestLevel: e.target.value })}>{['school pilot', 'classroom trial', 'student premium', 'feedback interview', 'just exploring'].map((interest) => <option key={interest}>{interest}</option>)}</Select></div><Textarea placeholder="What would make this useful for your class, club, or learning goal?" value={waitlist.message} onChange={(e) => setWaitlist({ ...waitlist, message: e.target.value })} /><Button className="bg-sky-400 text-slate-950">Request pilot / join waitlist</Button></form></Card>
          <Card className="p-6"><Globe2 className="text-sky-300" /><h2 className="mt-4 text-2xl font-semibold text-white">Built for emerging-market learners</h2><p className="mt-3 text-sm text-slate-300">The MVP prioritizes beginner clarity, low-cost access, Uzbek/English learning pathways, and school/cohort purchasing because individual-only subscriptions require far more scale.</p><div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">Next validation target: 100 demo users, 10 serious feedback interviews, 3 school/cohort pilot conversations, and one paid pilot offer.</div></Card>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 py-8 text-sm text-slate-400"><p>CyberPath Academy is beta defensive cybersecurity education software using fictional practice data in the public demo.</p><div className="flex flex-wrap gap-4"><Link to="/pricing">Pricing</Link><Link to="/support">Support</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/safety">Safety</Link></div></footer>
      </div>
    </div>
  );
}
