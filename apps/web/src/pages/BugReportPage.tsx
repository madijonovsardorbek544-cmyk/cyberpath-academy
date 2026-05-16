import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, SectionTitle, Select, Textarea } from '../components/ui';

function BugReportContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ page: location.pathname, happened: '', expected: '', deviceBrowser: navigator.userAgent, screenshotNote: '', contact: user?.email || '', severity: 'medium' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const response = await api.post<{ message: string }>('/platform/bug-reports', form);
      setMessage(response.message || 'Bug report saved.');
      setForm((current) => ({ ...current, happened: '', expected: '', screenshotNote: '' }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save bug report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Bug report" title="Tell us exactly what broke in beta." subtitle="Useful beta bugs include the page, observed behavior, expected behavior, device/browser, severity, and optional contact. Screenshots are noted as placeholders in the demo." />
      {message ? <Card className="p-4 text-sm text-emerald-300">{message}</Card> : null}
      <Card className="p-6">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2"><Input required value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} placeholder="Page or URL" /><Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="blocking">Blocking</option></Select></div>
          <Textarea required value={form.happened} onChange={(e) => setForm({ ...form, happened: e.target.value })} placeholder="What happened?" />
          <Textarea required value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} placeholder="What did you expect?" />
          <Input required value={form.deviceBrowser} onChange={(e) => setForm({ ...form, deviceBrowser: e.target.value })} placeholder="Device/browser" />
          <Input value={form.screenshotNote} onChange={(e) => setForm({ ...form, screenshotNote: e.target.value })} placeholder="Screenshot placeholder or filename (optional)" />
          <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Optional contact" />
          <Button disabled={submitting} className="bg-rose-400 text-slate-950">{submitting ? 'Submitting...' : 'Submit bug report'}</Button>
        </form>
      </Card>
    </div>
  );
}

export function BugReportPage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-100" />;
  if (!user) return <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><Link to="/" className="text-sm text-sky-300">← Back to landing</Link><div className="mt-6"><BugReportContent /></div></div></div>;
  return <AppShell><BugReportContent /></AppShell>;
}
