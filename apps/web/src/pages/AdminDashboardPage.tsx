import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Input, Loader, SectionTitle, Select, StatCard, Textarea } from '../components/ui';

const defaultLesson = {
  slug: 'new-lesson-slug',
  title: 'New lesson title',
  phase: 1,
  phaseTitle: 'Foundations',
  level: 'Beginner',
  orderIndex: 99,
  learningObjectives: ['Objective one', 'Objective two'],
  content: 'Write lesson content here with at least one concrete explanation.',
  glossary: [{ term: 'Term', definition: 'Definition' }],
  examples: ['Example one'],
  knowledgeChecks: ['Check one'],
  commonMistakes: 'Describe a real mistake learners make.',
  whyItMatters: 'Explain the real-work reason clearly.'
};

const defaultLab = {
  slug: 'new-lab-slug',
  title: 'New lab title',
  category: 'Log analysis',
  difficulty: 'Beginner',
  description: 'Write a safe defensive lab description.',
  dataset: { sample: true },
  tasks: [{ id: 'task1', prompt: 'What stands out?', expectedKeywords: ['keyword'] }],
  safeGuardrails: 'Authorized toy environment only.',
  solutionOutline: 'Brief safe solution outline.'
};

export function AdminDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [lessonDraft, setLessonDraft] = useState(JSON.stringify(defaultLesson, null, 2));
  const [labDraft, setLabDraft] = useState(JSON.stringify(defaultLab, null, 2));

  const load = async () => setData(await api.get<any>('/admin/overview'));
  useEffect(() => { load(); }, []);

  if (!data) return <AppShell><Loader text="Loading admin tools..." /></AppShell>;

  const createLesson = async (event: FormEvent) => {
    event.preventDefault();
    await api.post('/admin/lessons', JSON.parse(lessonDraft));
    load();
  };

  const createLab = async (event: FormEvent) => {
    event.preventDefault();
    await api.post('/admin/labs', JSON.parse(labDraft));
    load();
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Admin dashboard · beta operations" title="Manage users, content, cohorts, validation, and product health." subtitle="This is deliberately framed as beta operations: content quality, school-pilot demand, feedback, subscriptions, platform health, and demo conversion signals." />
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-50">Beta operations note: simulated demo metrics are directional only. Production should store events server-side with privacy review, retention rules, and school-safe reporting.</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Users" value={data.stats.users} />
          <StatCard label="Lessons" value={data.stats.lessons} />
          <StatCard label="Labs" value={data.stats.labs} />
          <StatCard label="Completion rate" value={`${data.stats.completionRate}%`} />
          <StatCard label="Open feedback" value={data.stats.openPlatformFeedback} />
          <StatCard label="Queued emails" value={data.stats.queuedEmails} />
          <StatCard label="Pilot leads" value={data.stats.pilotLeads ?? data.stats.waitlistSubmissions ?? 0} />
          <StatCard label="Ready pilots" value={data.stats.readyPilotLeads ?? data.stats.schoolPilotInterest ?? 0} />
          <StatCard label="Demo starts" value={data.stats.demoStarts ?? 0} />
          <StatCard label="Artifacts" value={data.stats.artifactsCreated ?? 0} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Startup validation metrics</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Usefulness score: {data.validationMetrics?.usefulnessScore ?? 0}/5</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Demo → waitlist: {data.validationMetrics?.demoConversionSignals?.demoToWaitlist ?? 0}%</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Willingness to pay: yes {data.validationMetrics?.willingnessToPay?.yes ?? 0}, maybe {data.validationMetrics?.willingnessToPay?.maybe ?? 0}</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">School pilot requests: {data.validationMetrics?.demoConversionSignals?.schoolPilotRequests ?? 0}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{(data.validationMetrics?.mostRequestedTopics || []).map((topic: string) => <Badge key={topic}>{topic}</Badge>)}</div>
            <p className="mt-3 text-sm text-slate-400">Confusion themes: {(data.validationMetrics?.confusionThemes || []).join(', ')}</p>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">School pilot / waitlist pipeline</h3>
            <div className="mt-4 space-y-3 max-h-[300px] overflow-auto pr-1">
              {(data.waitlist || []).map((item: any) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium text-white">{item.name}</p><Badge>{item.interestLevel}</Badge></div><p className="mt-1 text-sm text-slate-400">{item.organization || 'No org'} · {item.countryCity || 'No location'} · {item.studentCount || 0} students</p><p className="mt-2 text-sm text-slate-300">{item.message}</p></div>)}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Users and roles</h3>
            <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
              {data.users.map((user: any) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div>
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={user.role} onChange={async (event) => { await api.patch(`/admin/users/${user.id}/role`, { role: event.target.value }); load(); }}>
                      {['student', 'mentor', 'admin'].map((role) => <option key={role} value={role}>{role}</option>)}
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Lessons</h3>
            <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
              {data.lessons.map((lesson: any) => (
                <div key={lesson.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Input value={lesson.title} onChange={(event) => setData((prev: any) => ({ ...prev, lessons: prev.lessons.map((item: any) => item.id === lesson.id ? { ...item, title: event.target.value } : item) }))} />
                    <div className="flex gap-2">
                      <Button className="bg-slate-200 text-slate-950" onClick={async () => { await api.patch(`/admin/lessons/${lesson.id}`, { title: lesson.title }); load(); }}>Save</Button>
                      <Button className="bg-rose-500 text-white" onClick={async () => { await api.delete(`/admin/lessons/${lesson.id}`); load(); }}>Delete</Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge>Phase {lesson.phase}</Badge><Badge>{lesson.level}</Badge></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Create lesson</h3>
            <form className="mt-4 space-y-4" onSubmit={createLesson}>
              <Textarea value={lessonDraft} onChange={(event) => setLessonDraft(event.target.value)} className="min-h-[300px]" />
              <Button className="bg-sky-400 text-slate-950">Create lesson</Button>
            </form>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Create lab</h3>
            <form className="mt-4 space-y-4" onSubmit={createLab}>
              <Textarea value={labDraft} onChange={(event) => setLabDraft(event.target.value)} className="min-h-[300px]" />
              <Button className="bg-sky-400 text-slate-950">Create lab</Button>
            </form>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-white">School pilot leads</h3><Badge>{data.pilotLeads?.length ?? 0} leads</Badge></div>
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {(data.pilotLeads || []).map((lead: any) => (
                <div key={lead.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="font-medium text-white">{lead.contactName} · {lead.organizationName}</p><p className="text-sm text-slate-400">{lead.cityCountry} · {lead.studentCount ?? 'unknown'} students · {lead.role}</p></div>
                    <Select className="w-auto min-w-[150px]" value={lead.status} onChange={async (event) => { await api.patch(`/platform/pilot-leads/${lead.id}`, { status: event.target.value }); load(); }}>
                      {['new', 'contacted', 'qualified', 'pilot_started', 'closed'].map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge>{lead.interestLevel}</Badge><Badge>Would pay: {lead.wouldPay}</Badge><Badge>{lead.studentAgeRange || 'age n/a'}</Badge></div>
                  <p className="mt-3 text-sm text-slate-300">Needs: {lead.needsMost}</p>
                  {lead.message ? <p className="mt-2 text-sm text-slate-400">Message: {lead.message}</p> : null}
                  <Textarea className="mt-3" placeholder="Admin follow-up notes" value={lead.notes || ''} onChange={(event) => setData((prev: any) => ({ ...prev, pilotLeads: prev.pilotLeads.map((item: any) => item.id === lead.id ? { ...item, notes: event.target.value } : item) }))} />
                  <Button className="mt-3 bg-slate-200 text-slate-950" onClick={async () => { await api.patch(`/platform/pilot-leads/${lead.id}`, { notes: lead.notes || null }); load(); }}>Save notes</Button>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Pilot quality checklist</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {['Call decision-maker within 48 hours', 'Confirm age range, class size, device constraints', 'Show mentor dashboard and CSV report', 'Collect willingness-to-pay and safety objections', 'Only promise defensive fictional labs'].map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">{item}</div>)}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Platform feedback queue</h3>
            <div className="mt-4 space-y-3 max-h-[360px] overflow-auto pr-1">
              {data.platformFeedback.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge>{item.category}</Badge>
                    <Select value={item.status} onChange={async (event) => { await api.patch(`/platform/feedback/${item.id}/status`, { status: event.target.value }); load(); }}>
                      {['new', 'reviewed', 'resolved'].map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.email}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Email outbox</h3>
            <div className="mt-4 space-y-3 max-h-[360px] overflow-auto pr-1">
              {data.emailOutbox.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.subject}</p><Badge>{item.status}</Badge></div>
                  <p className="mt-2 text-sm text-slate-400">{item.toEmail}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.messageType}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Audit log</h3>
            <div className="mt-4 space-y-3 max-h-[360px] overflow-auto pr-1">
              {data.auditLogs.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="font-medium text-white">{item.action}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.targetType} · {item.targetId || 'n/a'}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
