import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, isMockApiMode } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Button, Card, Input, Select, Textarea } from './ui';

const betaBannerCopy = 'CyberPath Academy is in beta. Use fictional labs only. Please report confusing or broken parts.';

function resetDemoData() {
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith('cyberpath-demo-db-'))
    .forEach((key) => window.localStorage.removeItem(key));
  window.location.hash = '#/';
  window.location.reload();
}

export function BetaBanner() {
  return (
    <div className="border-b border-amber-300/30 bg-amber-950/95 px-4 py-3 text-sm text-amber-50 shadow-lg shadow-amber-950/20">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 text-center md:justify-between md:text-left">
        <p><strong>Beta:</strong> {betaBannerCopy} Data may reset in public demo mode. Defensive-only: no real hacking, scanning, exploitation, or real target testing.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/report-bug" className="rounded-full border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-300/10">Report bug</Link>
          <Link to="/support" className="rounded-full border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100 hover:bg-sky-300/10">Give feedback</Link>
          <Link to="/school-pilot" className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-300/10">Request school pilot</Link>
          {isMockApiMode ? <button type="button" onClick={resetDemoData} className="rounded-full border border-slate-300/40 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-300/10">Reset demo data</button> : null}
        </div>
      </div>
    </div>
  );
}

export function BetaQuickActions() {
  return (
    <Card className="border-amber-400/20 bg-amber-400/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="border-amber-300/30 bg-amber-300/10 text-amber-100">Controlled beta</Badge>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">{betaBannerCopy} Public demo data is local to this browser and may reset. Only use fictional labs and authorized toy data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/report-bug" className="rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-medium text-rose-100 hover:bg-rose-400/10">Report bug</Link>
          <Link to="/support" className="rounded-2xl border border-sky-400/30 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-400/10">Give feedback</Link>
          <Link to="/school-pilot" className="rounded-2xl border border-emerald-400/30 px-4 py-3 text-sm font-medium text-emerald-100 hover:bg-emerald-400/10">Request school pilot</Link>
          {isMockApiMode ? <Button type="button" onClick={resetDemoData} className="border border-slate-700 text-slate-100">Reset demo data</Button> : null}
        </div>
      </div>
    </Card>
  );
}

export function BetaFeedbackCard({ context, contentId, title = 'Beta feedback checkpoint' }: { context: string; contentId?: string; title?: string }) {
  const { user } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({
    usefulness: '4',
    difficulty: 'right_level',
    confused: '',
    improve: '',
    wouldRecommend: 'maybe',
    wouldPay: 'maybe',
    role: user?.role === 'mentor' ? 'mentor' : user?.role === 'admin' ? 'mentor' : 'student',
    contact: user?.email || ''
  });
  const [saved, setSaved] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSaved('');
    const message = `Context: ${context} (${location.pathname}). Confused: ${form.confused || 'none'}. Improve: ${form.improve || 'none'}. Would recommend: ${form.wouldRecommend}. Would pay: ${form.wouldPay}.`;
    try {
      const payload = {
        name: user?.name || form.role,
        email: form.contact || user?.email || 'beta@example.com',
        category: 'support',
        message,
        usefulnessScore: Number(form.usefulness),
        usefulnessRating: Number(form.usefulness),
        difficulty: form.difficulty,
        difficultyRating: form.difficulty,
        willingnessToPay: form.wouldPay,
        wouldPay: form.wouldPay,
        wouldRecommend: form.wouldRecommend,
        audienceRole: form.role,
        goal: context,
        contentType: context.includes('lab') ? 'lab' : context.includes('lesson') ? 'lesson' : context.includes('artifact') ? 'portfolio' : context.includes('onboarding') ? 'onboarding' : 'project',
        contentId: contentId || `${context}:${location.pathname}`,
        confusionNote: form.confused,
        missingExplanation: form.improve,
        learnerGoal: 'school'
      };
      const response = user ? await api.post<{ message: string }>('/platform/my-feedback', payload) : await api.post<{ message: string }>('/platform/feedback', payload);
      setSaved(response.message || 'Feedback saved.');
      setForm((current) => ({ ...current, confused: '', improve: '' }));
    } catch (error) {
      setSaved(error instanceof Error ? error.message : 'Could not save feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-sky-400/20 bg-sky-400/5 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">30 seconds: tell us if this beta step was useful, confusing, and worth paying for.</p>
      {saved ? <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{saved}</div> : null}
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-3"><Select value={form.usefulness} onChange={(e) => setForm({ ...form, usefulness: e.target.value })}>{['5','4','3','2','1'].map((score) => <option key={score} value={score}>Usefulness {score}/5</option>)}</Select><Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="too_easy">Too easy</option><option value="right_level">Right level</option><option value="too_hard">Too hard</option></Select><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{['student','teacher','parent','mentor','school leader'].map((role) => <option key={role} value={role}>{role}</option>)}</Select></div>
        <div className="grid gap-3 sm:grid-cols-2"><Textarea value={form.confused} onChange={(e) => setForm({ ...form, confused: e.target.value })} placeholder="What confused you?" /><Textarea value={form.improve} onChange={(e) => setForm({ ...form, improve: e.target.value })} placeholder="What should improve or be added?" /></div>
        <div className="grid gap-3 sm:grid-cols-3"><Select value={form.wouldRecommend} onChange={(e) => setForm({ ...form, wouldRecommend: e.target.value })}><option value="yes">Would recommend: yes</option><option value="maybe">Would recommend: maybe</option><option value="no">Would recommend: no</option></Select><Select value={form.wouldPay} onChange={(e) => setForm({ ...form, wouldPay: e.target.value })}><option value="yes">Would pay: yes</option><option value="maybe">Would pay: maybe</option><option value="no">Would pay: no</option></Select><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Optional contact" /></div>
        <Button disabled={submitting} className="bg-sky-400 text-slate-950">{submitting ? 'Saving...' : 'Submit beta feedback'}</Button>
      </form>
    </Card>
  );
}
