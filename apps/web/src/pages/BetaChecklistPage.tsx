import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { BetaFeedbackCard, BetaQuickActions } from '../components/BetaMode';
import { Badge, Card, SectionTitle } from '../components/ui';

export function BetaChecklistPage() {
  const studentJourney = ['Create an account', 'Finish onboarding', 'Complete the first lesson', 'Answer one practice set', 'Submit one safe fictional lab', 'Create one portfolio artifact', 'Submit beta feedback'];
  const teacherJourney = ['Try mentor demo', 'View cohort dashboard', 'Inspect weak topics', 'Open a student report', 'Review an artifact', 'Submit school pilot interest'];
  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Beta checklist" title="Test the product like a real student or teacher — not like a founder." subtitle="The pilot is successful only if users understand what to do, finish a learning loop, report confusion, and expose what breaks." />
        <BetaQuickActions />
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-6"><Badge>Student beta journey</Badge><ol className="mt-4 space-y-3 text-sm text-slate-300">{studentJourney.map((item, index) => <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><strong className="text-white">{index + 1}.</strong> {item}</li>)}</ol></Card>
          <Card className="p-6"><Badge>Teacher beta journey</Badge><ol className="mt-4 space-y-3 text-sm text-slate-300">{teacherJourney.map((item, index) => <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><strong className="text-white">{index + 1}.</strong> {item}</li>)}</ol></Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5"><h3 className="font-semibold text-white">What to test</h3><p className="mt-2 text-sm text-slate-400">Can a learner complete one lesson, practice set, lab, and artifact without founder help? Can a teacher read dashboard risk signals?</p></Card>
          <Card className="p-5"><h3 className="font-semibold text-white">What to ignore</h3><p className="mt-2 text-sm text-slate-400">Ignore missing enterprise SSO, perfect content depth, paid checkout polish, and advanced lab breadth during this controlled beta.</p></Card>
          <Card className="p-5"><h3 className="font-semibold text-white">Success looks like</h3><p className="mt-2 text-sm text-slate-400">10 users finish core flows, 20 feedback items arrive, bugs are specific, and at least one school/mentor asks for a pilot conversation.</p></Card>
        </div>
        <Card className="p-6"><h3 className="text-lg font-semibold text-white">Safety boundary</h3><p className="mt-2 text-sm text-slate-300">CyberPath Academy is defensive-only. Use fictional labs, toy datasets, and authorized exercises only. Do not scan, exploit, test, or investigate real systems, real accounts, or real people.</p><div className="mt-4 flex flex-wrap gap-3"><Link to="/dashboard" className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950">Start student test</Link><Link to="/teacher" className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">Try teacher dashboard</Link></div></Card>
        <BetaFeedbackCard context="beta_checklist" title="Checklist feedback" />
      </div>
    </AppShell>
  );
}
