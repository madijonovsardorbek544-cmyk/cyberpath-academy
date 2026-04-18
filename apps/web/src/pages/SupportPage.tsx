import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Button, Card, Input, Loader, SectionTitle, Select, Textarea } from '../components/ui';
import type { FeedbackItem } from '../types';

function SupportContent() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('support');
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<{ feedback: FeedbackItem[] }>('/platform/my-feedback').then((data) => setItems(data.feedback)).catch(() => setItems([]));
  }, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatusMessage('');
    try {
      const payload = { name, email, category, message };
      const response = user
        ? await api.post<{ message: string }>('/platform/my-feedback', payload)
        : await api.post<{ message: string }>('/platform/feedback', payload);
      setStatusMessage(response.message);
      setMessage('');
      if (user) {
        const refreshed = await api.get<{ feedback: FeedbackItem[] }>('/platform/my-feedback');
        setItems(refreshed.feedback);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Support and user feedback" title="Collect real feedback or your product will drift into fantasy." subtitle="Use this page to capture bugs, content issues, feature requests, and billing/support notes. Replies and billing support should route through madijonovsardorbek544@gmail.com in production." />
      {statusMessage ? <Card className="p-4 text-sm text-emerald-300">{statusMessage}</Card> : null}
      <div className="grid gap-5 lg:grid-cols-[1fr,0.9fr]">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white">Submit feedback</h3>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required />
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              {['support', 'bug', 'content', 'feature', 'billing'].map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Be specific. What broke, what confused you, or what needs improvement?" required />
            <Button className="bg-sky-400 text-slate-950" disabled={loading}>{loading ? 'Submitting...' : 'Send feedback'}</Button>
          </form>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white">What gets handled first</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Broken learning flow or auth bug</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Incorrect cybersecurity content or misleading explanation</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Accessibility issue on mobile or keyboard navigation</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Billing/support questions and roadmap requests</div>
          </div>
        </Card>
      </div>
      {user ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white">Your feedback history</h3>
          {!items.length ? <Loader text="No submitted feedback yet." /> : <div className="mt-4 space-y-3">{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium text-white">{item.category}</p><Badge>{item.status}</Badge></div><p className="mt-2 text-sm text-slate-300">{item.message}</p><p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div>)}</div>}
        </Card>
      ) : null}
    </div>
  );
}

export function SupportPage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-100"><Loader text="Loading support..." /></div>;
  if (!user) {
    return <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><Link to="/" className="text-sm text-sky-300">← Back to landing</Link><div className="mt-6"><SupportContent /></div></div></div>;
  }
  return <AppShell><SupportContent /></AppShell>;
}
