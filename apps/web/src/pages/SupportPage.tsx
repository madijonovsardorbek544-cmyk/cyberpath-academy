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
  const [confused, setConfused] = useState('');
  const [improve, setImprove] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState('maybe');
  const [message, setMessage] = useState('');
  const [usefulnessScore, setUsefulnessScore] = useState('4');
  const [difficulty, setDifficulty] = useState('right_level');
  const [willingnessToPay, setWillingnessToPay] = useState('maybe');
  const [audienceRole, setAudienceRole] = useState('student');
  const [goal, setGoal] = useState('');
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
      const payload = { name, email, category, message: `${message} Confused: ${confused || 'none'}. Improve: ${improve || 'none'}. Would recommend: ${wouldRecommend}.`, usefulnessScore: Number(usefulnessScore), usefulnessRating: Number(usefulnessScore), difficulty, difficultyRating: difficulty, willingnessToPay, wouldPay: willingnessToPay, wouldRecommend, audienceRole, goal, contentType: 'onboarding', contentId: goal || 'general', confusionNote: confused, missingExplanation: improve, learnerGoal: 'school' }; 
      const response = user
        ? await api.post<{ message: string }>('/platform/my-feedback', payload)
        : await api.post<{ message: string }>('/platform/feedback', payload);
      setStatusMessage(response.message);
      setMessage('');
      setConfused('');
      setImprove('');
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
            <div className="grid gap-3 sm:grid-cols-2"><Select value={usefulnessScore} onChange={(event) => setUsefulnessScore(event.target.value)}>{['5', '4', '3', '2', '1'].map((score) => <option key={score} value={score}>Usefulness {score}/5</option>)}</Select><Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{[['too_easy', 'Too easy'], ['right_level', 'Right level'], ['too_hard', 'Too hard']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><div className="grid gap-3 sm:grid-cols-3"><Select value={wouldRecommend} onChange={(event) => setWouldRecommend(event.target.value)}>{['yes', 'maybe', 'no'].map((item) => <option key={item} value={item}>Would recommend: {item}</option>)}</Select><Select value={willingnessToPay} onChange={(event) => setWillingnessToPay(event.target.value)}>{['yes', 'maybe', 'no'].map((item) => <option key={item} value={item}>Would pay: {item}</option>)}</Select><Select value={audienceRole} onChange={(event) => setAudienceRole(event.target.value)}>{['student', 'parent', 'teacher', 'mentor', 'school leader'].map((item) => <option key={item} value={item}>{item}</option>)}</Select></div><div className="grid gap-3 sm:grid-cols-2"><Textarea value={confused} onChange={(event) => setConfused(event.target.value)} placeholder="What confused you?" /><Textarea value={improve} onChange={(event) => setImprove(event.target.value)} placeholder="What should improve?" /></div><Input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Your goal: class, club, certificate, SOC, GRC, university, etc." /><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Was this useful? What confused you? What should be added? Would you recommend it to a classmate or school?" required />
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
