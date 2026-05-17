import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, FormField, Input, SectionTitle, Select, Textarea } from '../components/ui';

function BugReportContent() {
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [form, setForm] = useState({ page: params.get('page') || location.pathname, happened: '', expected: '', deviceBrowser: navigator.userAgent, screenshotNote: '', contact: user?.email || '', severity: 'medium' });
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
          <div className="grid gap-3 sm:grid-cols-2"><FormField id="bug-page" label="Page or URL"><Input id="bug-page" required value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} placeholder="/labs/demo-access-review" /></FormField><FormField id="bug-severity" label="Severity"><Select id="bug-severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="blocking">Blocking</option></Select></FormField></div>
          <FormField id="bug-happened" label="What happened?"><Textarea id="bug-happened" required value={form.happened} onChange={(e) => setForm({ ...form, happened: e.target.value })} placeholder="Describe the broken or confusing behavior." /></FormField>
          <FormField id="bug-expected" label="What did you expect?"><Textarea id="bug-expected" required value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} placeholder="Describe the outcome you expected." /></FormField>
          <FormField id="bug-device" label="Device/browser"><Input id="bug-device" required value={form.deviceBrowser} onChange={(e) => setForm({ ...form, deviceBrowser: e.target.value })} placeholder="iPhone Safari, Chromebook Chrome, etc." /></FormField>
          <FormField id="bug-screenshot" label="Screenshot note" hint="Optional: filename or what the screenshot shows."><Input id="bug-screenshot" value={form.screenshotNote} onChange={(e) => setForm({ ...form, screenshotNote: e.target.value })} placeholder="screenshot-lab-submit.png" /></FormField>
          <FormField id="bug-contact" label="Optional contact"><Input id="bug-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="email@example.com" /></FormField>
          <Button type="submit" disabled={submitting} className="bg-rose-400 text-slate-950">{submitting ? 'Submitting...' : 'Submit bug report'}</Button>
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
