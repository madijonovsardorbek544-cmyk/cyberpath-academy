import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Input, SectionTitle, Select, Textarea } from '../components/ui';
import { api } from '../api/client';
import { BetaFeedbackCard, BetaQuickActions } from '../components/BetaMode';

type PilotForm = {
  contactName: string;
  email: string;
  phoneOrTelegram: string;
  role: 'student' | 'parent' | 'teacher' | 'mentor' | 'school_leader' | 'learning_center_owner' | 'other';
  organizationName: string;
  cityCountry: string;
  studentCount: string;
  studentAgeRange: string;
  currentCyberLevel: string;
  needsMost: string;
  interestLevel: 'curious' | 'interested' | 'ready_for_pilot';
  wouldPay: 'yes' | 'no' | 'maybe';
  message: string;
};

const initialForm: PilotForm = {
  contactName: '',
  email: '',
  phoneOrTelegram: '',
  role: 'teacher',
  organizationName: '',
  cityCountry: '',
  studentCount: '',
  studentAgeRange: '',
  currentCyberLevel: 'Beginner / no structured cybersecurity class yet',
  needsMost: '',
  interestLevel: 'interested',
  wouldPay: 'maybe',
  message: ''
};

export function SchoolPilotPage() {
  const [form, setForm] = useState<PilotForm>(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await api.post<{ message: string }>('/platform/pilot-leads', {
        ...form,
        studentCount: form.studentCount ? Number(form.studentCount) : null,
        phoneOrTelegram: form.phoneOrTelegram || null,
        studentAgeRange: form.studentAgeRange || null,
        message: form.message || null
      });
      setMessage(response.message);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit pilot request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-sm text-sky-300">← Back to CyberPath Academy</Link>
          <div className="flex flex-wrap gap-3"><Link to="/pricing" className="text-sm text-slate-300">Pricing</Link><Link to="/safety" className="text-sm text-slate-300">Safety policy</Link></div>
        </header>

        <BetaQuickActions />

        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
          <div className="space-y-5">
            <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">School Pilot Engine</Badge>
            <SectionTitle eyebrow="For schools, cyber clubs, and learning centers" title="Request a safe defensive cybersecurity pilot." subtitle="Tell us who you teach, what support you need, and whether this could become a paid cohort. We use fictional labs, mentor dashboards, student reports, and portfolio proof — not unsafe hacking workflows." />
            <div className="grid gap-4">
              {[
                ['Defensive-only promise', 'Fictional datasets, authorization reminders, no malware, no credential theft, no real-target attacks.'],
                ['Cohort-ready reporting', 'Mentors can review progress, weak topics, lab submissions, assignments, artifacts, and CSV reports.'],
                ['Beginner/emerging-market fit', 'Designed for teenagers, Uzbek/English learners, cyber clubs, and learning centers that need trust and accountability.']
              ].map(([title, copy]) => (
                <Card key={title} className="p-5"><div className="flex gap-3"><ShieldCheck className="mt-1 text-emerald-300" size={20} /><div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-sm text-slate-400">{copy}</p></div></div></Card>
              ))}
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3"><Building2 className="text-sky-300" /><h1 className="text-2xl font-semibold text-white">School pilot request</h1></div>
            {message ? <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline" size={16} />{message}</div> : null}
            {error ? <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div> : null}
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-2"><Input required placeholder="Contact name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /><Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Phone or Telegram" value={form.phoneOrTelegram} onChange={(e) => setForm({ ...form, phoneOrTelegram: e.target.value })} /><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PilotForm['role'] })}>{[['student','Student'],['parent','Parent'],['teacher','Teacher'],['mentor','Mentor'],['school_leader','School leader'],['learning_center_owner','Learning center owner'],['other','Other']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input required placeholder="Organization / school name" value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} /><Input required placeholder="City / country" value={form.cityCountry} onChange={(e) => setForm({ ...form, cityCountry: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input type="number" min="0" placeholder="Number of students" value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: e.target.value })} /><Input placeholder="Student age range" value={form.studentAgeRange} onChange={(e) => setForm({ ...form, studentAgeRange: e.target.value })} /></div>
              <Input required placeholder="Current cybersecurity education level" value={form.currentCyberLevel} onChange={(e) => setForm({ ...form, currentCyberLevel: e.target.value })} />
              <Textarea required placeholder="What do you need most? (safe labs, teacher dashboard, reports, Uzbek/English content, mentor support...)" value={form.needsMost} onChange={(e) => setForm({ ...form, needsMost: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2"><Select value={form.interestLevel} onChange={(e) => setForm({ ...form, interestLevel: e.target.value as PilotForm['interestLevel'] })}><option value="curious">Curious</option><option value="interested">Interested</option><option value="ready_for_pilot">Ready for pilot</option></Select><Select value={form.wouldPay} onChange={(e) => setForm({ ...form, wouldPay: e.target.value as PilotForm['wouldPay'] })}><option value="maybe">Would pay: maybe</option><option value="yes">Would pay: yes</option><option value="no">Would pay: no</option></Select></div>
              <Textarea placeholder="Message / constraints / timeline" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button disabled={submitting} className="w-full bg-sky-400 text-slate-950">{submitting ? 'Submitting...' : 'Request school pilot'}</Button>
            </form>
          </Card>
        </section>
        <BetaFeedbackCard context="school_pilot_form" title="School pilot form feedback" />
      </div>
    </div>
  );
}
