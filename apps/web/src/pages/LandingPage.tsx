import { Link } from 'react-router-dom';
import { Shield, ChartNoAxesCombined, FlaskConical, Brain, BadgeCheck, Lock } from 'lucide-react';
import { Badge, Button, Card, SectionTitle } from '../components/ui';
import { useLocale } from '../contexts/LocaleContext';

const features = [
  { title: 'Structured from zero to pro', copy: 'Five phases, guided onboarding, and specialization tracks that stop learners from wandering aimlessly.', icon: Shield },
  { title: 'Progress that actually means something', copy: 'Completion rate, streaks, weak topics, readiness scores, and mentor-visible analytics.', icon: ChartNoAxesCombined },
  { title: 'Safe defensive labs', copy: 'Fictional log analysis, phishing triage, cloud IAM review, secure coding fixes, and incident triage only.', icon: FlaskConical },
  { title: 'Tutor with guardrails', copy: 'Explain simply or deeply, analyze mistakes, and refuse unsafe offensive requests.', icon: Brain }
];

export function LandingPage() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="min-h-screen bg-slate-950 bg-glow text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/70 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/20 p-3 text-sky-300"><Shield size={20} /></div>
            <div>
              <p className="font-semibold text-white">CyberPath Academy</p>
              <p className="text-xs text-slate-400">{t('adaptive')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select aria-label={t('locale')} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'uz' | 'ru')}><option value="en">EN</option><option value="uz">UZ</option><option value="ru">RU</option></select>
            <Link className="text-sm text-slate-300" to="/pricing">{t('pricing')}</Link>
            <Link className="text-sm text-slate-300" to="/login">{t('login')}</Link>
            <Link to="/login"><Button className="bg-sky-400 text-slate-950">{t('startLearning')}</Button></Link>
          </div>
        </header>

        <section className="grid gap-8 py-16 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">Beginner-friendly · Professional depth · Safe by design</Badge>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Build real cybersecurity skill without fake hype, unsafe content, or scattered learning.</h1>
            <p className="max-w-2xl text-lg text-slate-300">CyberPath Academy gives you structured lessons, adaptive quizzes, defensive labs, mentor insight, and a serious coaching workflow from absolute beginner to specialization readiness.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login"><Button className="bg-sky-400 text-slate-950">{t('createAccount')}</Button></Link>
              <Link to="/pricing"><Button className="border border-slate-700 bg-slate-900 text-white">{t('viewPricing')}</Button></Link>
              <a href="#curriculum"><Button className="border border-slate-700 bg-slate-900 text-white">{t('exploreCurriculum')}</Button></a>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Lock size={16} /> Role-based access</span>
              <span className="flex items-center gap-2"><BadgeCheck size={16} /> Seeded demo accounts</span>
              <span className="flex items-center gap-2"><Shield size={16} /> PWA mobile install</span>
            </div>
          </div>
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Beginner path</p>
                <p className="mt-3 text-3xl font-semibold text-white">24 lessons</p>
                <p className="mt-2 text-sm text-slate-400">Foundations through professionalization</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Assessment engine</p>
                <p className="mt-3 text-3xl font-semibold text-white">96 questions</p>
                <p className="mt-2 text-sm text-slate-400">Immediate explanations and topic scoring</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5 sm:col-span-2">
                <p className="text-sm text-slate-400">Specialization tracks</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['SOC', 'AppSec', 'Cloud Security', 'Security Engineering', 'GRC', 'Incident Response'].map((item) => <Badge key={item}>{item}</Badge>)}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section id="curriculum" className="space-y-8 py-12">
          <SectionTitle eyebrow="Why it works" title="One platform, full learning loop." subtitle="Learn, test, fail safely, review mistakes, get coaching, and track readiness without duct-taping tools together." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-5">
                  <div className="w-fit rounded-2xl bg-sky-400/15 p-3 text-sky-300"><Icon size={20} /></div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{feature.copy}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 py-12 lg:grid-cols-3">
          {[
            { title: 'Absolute beginner', copy: 'Start with the CIA triad, risk basics, identity, phishing, operating systems, and networking with plain-language explanations.' },
            { title: 'Developing practitioner', copy: 'Move into patching, SIEM, EDR, secure coding, sessions and tokens, cloud IAM, and defensive labs.' },
            { title: 'Professional specialization', copy: 'Build portfolio-ready capstones for SOC, AppSec, cloud security, incident response, security engineering, or GRC.' }
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-400">{item.copy}</p>
            </Card>
          ))}
        </section>

        <section className="space-y-5 py-12">
          <SectionTitle eyebrow="Testimonials" title="Social proof placeholder, not fake nonsense." subtitle="Replace these with real learner quotes later. Right now they clearly indicate seeded placeholder content." />
          <div className="grid gap-5 md:grid-cols-3">
            {['Placeholder testimonial from a beginner learner', 'Placeholder testimonial from a mentor', 'Placeholder testimonial from a hiring manager review'].map((item) => (
              <Card key={item} className="p-6"><p className="text-sm text-slate-300">{item}</p></Card>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 py-8 text-sm text-slate-400">
          <p>Launch this as beta. Earn the right to call it mature later.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/pricing">Pricing</Link>
            <Link to="/support">Support</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/safety">Safety</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
