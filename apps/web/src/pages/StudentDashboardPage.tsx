import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle, StatCard } from '../components/ui';
import type { DashboardResponse } from '../types';

export function StudentDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    api.get<DashboardResponse>('/learning/dashboard').then(setData);
  }, []);

  const claimCertificates = async () => {
    const response = await api.post<{ certificates: DashboardResponse['certificates'] }>('/learning/certificates/claim');
    setData((prev) => prev ? { ...prev, certificates: response.certificates } : prev);
  };

  if (!data) return <AppShell><Loader text="Loading dashboard..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Dashboard"
          title="Your cyber learning operating system."
          subtitle="This is no longer just a progress page. It now shows mastery state, due reviews, mentor assignments, guided projects, and proof-of-skill pressure in one place."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Lessons completed" value={data.analytics.totalCompleted} hint={`${data.analytics.completionRate}% of curriculum`} />
          <StatCard label="Quiz accuracy" value={`${data.analytics.totalQuizAccuracy}%`} hint="Average across attempts" />
          <StatCard label="Time studied" value={`${data.analytics.timeStudied} min`} hint="Lessons + quizzes" />
          <StatCard label="Due reviews" value={data.dueReviews.length} hint={`Streak ${data.analytics.streakDays} days`} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Continue learning</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{data.practiceHub.continueLesson?.title || 'Follow your next highest-value lesson'}</h3>
              </div>
              <Badge>{data.practiceHub.continueLesson?.phaseTitle || 'Core path'}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {data.practiceHub.continueLesson
                ? `${data.practiceHub.continueLesson.estimatedMinutes} minutes. Do the lesson, then clear one review action so the work actually sticks.`
                : 'No next lesson signal yet. Start with the learning paths and generate evidence.'}
            </p>
            {data.practiceHub.recoveryPlan ? (
              <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-amber-100">{data.practiceHub.recoveryPlan.title}</p>
                  <Badge className="border-amber-400/40 text-amber-200">recovery</Badge>
                </div>
                <p className="mt-2 text-sm text-amber-100/80">{data.practiceHub.recoveryPlan.summary}</p>
                <ul className="mt-3 space-y-2 text-sm text-amber-50/90">{data.practiceHub.recoveryPlan.actions.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              {data.practiceHub.continueLesson ? <Link to={`/lessons/${data.practiceHub.continueLesson.slug}`}><Button className="bg-sky-400 text-slate-950">Resume lesson</Button></Link> : null}
              <Link to="/practice"><Button className="border border-slate-700 bg-slate-900 text-white">Open practice hub</Button></Link>
              <Link to="/paths"><Button className="border border-slate-700 bg-slate-900 text-white">View paths</Button></Link>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {data.practiceHub.dailyQuest.steps.map((step, index) => (
                <Link key={step.id} to={step.href} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step {index + 1}</p>
                  <p className="mt-2 font-medium text-white">{step.label}</p>
                  <p className="mt-2 text-sm text-slate-400">{step.done ? 'Completed.' : 'Queued for today.'}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Retention pressure</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Due review queue</h3>
              </div>
              <Badge>{data.dueReviews.length} due</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {(data.dueReviews.length ? data.dueReviews : []).slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.topic}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.prompt}</p>
                    </div>
                    <Badge>{item.successStreak} streak</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Every skipped review is future forgetting you chose to buy.</p>
                </div>
              ))}
              {!data.dueReviews.length ? <p className="text-sm text-slate-400">No due reviews right now. Good. Keep it that way.</p> : null}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Topic accuracy</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.analytics.topicAccuracy.length ? data.analytics.topicAccuracy : [{ topic: 'No data yet', accuracy: 0 }] }>
                  <XAxis dataKey="topic" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Skill radar</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.analytics.skillRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Radar name="Skill" dataKey="value" fillOpacity={0.45} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Adaptive next steps</h3>
              {data.cohort ? <Badge>{data.cohort.name}</Badge> : <Badge>Solo track</Badge>}
            </div>
            <div className="mt-4 space-y-3">
              {data.recommendations.length ? data.recommendations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.title}</p>
                    <Badge className={item.priority === 'high' ? 'border-rose-400/40 text-rose-200' : item.priority === 'medium' ? 'border-amber-400/40 text-amber-200' : ''}>{item.priority} priority</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">Action: {item.actionType} → {item.actionTarget}</p>
                </div>
              )) : <p className="text-sm text-slate-400">No recommendation pressure yet. That usually means you have not done enough work to generate signals.</p>}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Mentor assignments</h3>
            <div className="mt-4 space-y-3">
              {data.assignments.length ? data.assignments.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.title}</p>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.instructions}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.trackSlug ? <Badge>{item.trackSlug}</Badge> : null}
                    {item.targetMastery ? <Badge>Target {item.targetMastery}%</Badge> : null}
                    {item.dueAt ? <Badge>Due {new Date(item.dueAt).toLocaleDateString()}</Badge> : null}
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400">No mentor assignments right now.</p>}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Portfolio and guided projects</h3>
            <div className="mt-4 space-y-3">
              {data.learnerProjects[0] ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">Active project: {data.learnerProjects[0].project.title}</p>
                    <Badge>{data.learnerProjects[0].status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{data.learnerProjects[0].project.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{data.learnerProjects[0].checkpointProgress.map((item) => <Badge key={item}>{item}</Badge>)}</div>
                </div>
              ) : null}
              {data.portfolio.length ? data.portfolio.map((artifact) => (
                <div key={artifact.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{artifact.title}</p>
                    <Badge>{artifact.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{artifact.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {artifact.deliverables.map((item) => <Badge key={item}>{item}</Badge>)}
                  </div>
                  {artifact.mentorFeedback ? <p className="mt-3 text-sm text-amber-200">Mentor note: {artifact.mentorFeedback}</p> : null}
                </div>
              )) : <p className="text-sm text-slate-400">No artifacts yet. That means you have not created proof of work yet.</p>}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Certificates and proof</h3>
              <Button className="bg-sky-400 text-slate-950" onClick={claimCertificates}>Claim eligible</Button>
            </div>
            <div className="mt-4 space-y-3">
              {data.certificates.length ? data.certificates.map((certificate) => (
                <div key={certificate.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="font-medium text-white">{certificate.title}</p>
                  <p className="mt-1 text-sm text-slate-400">Issued: {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Pending issuance'}</p>
                  <p className="mt-2 text-xs text-slate-500">Criteria: {certificate.criteria.score}% mastery · {certificate.criteria.completionRate}% completion · {certificate.criteria.quizAverage}% quiz average</p>
                  {certificate.criteria.assessedSkills?.length ? <div className="mt-3 flex flex-wrap gap-2">{certificate.criteria.assessedSkills.map((item) => <Badge key={item}>{item}</Badge>)}</div> : null}
                </div>
              )) : <p className="text-sm text-slate-400">No certificates yet. Earn them. Do not expect proof without evidence.</p>}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Mentor feedback and capstones</h3>
            <div className="mt-4 space-y-3">
              {data.mentorFeedback.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">{item.message}</div>)}
              {!data.mentorFeedback.length ? <p className="text-sm text-slate-400">No mentor notes yet.</p> : null}
            </div>
            <div className="mt-5 space-y-3">
              {data.capstones.slice(0, 3).map((capstone) => <div key={capstone.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><p className="font-medium text-white">{capstone.title}</p><p className="mt-1 text-sm text-slate-400">{capstone.summary}</p></div>)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Mastery states</h3>
              <Link to="/paths" className="text-sm text-sky-300">See all</Link>
            </div>
            <div className="mt-4 space-y-3">
              {data.mastery.map((track) => (
                <div key={track.trackSlug} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{track.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{track.frameworkRef}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge>{track.band}</Badge>
                      {track.reviewDueCount ? <Badge>{track.reviewDueCount} due</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(track.score, 6)}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Mastery {track.score}%</span>
                    <span>Completion {track.completionRate}%</span>
                    <span>Quiz average {track.quizAverage}%</span>
                    <span>Review health {track.reviewHealth ?? 0}%</span>
                  </div>
                  {track.skillSignals?.length ? <div className="mt-3 flex flex-wrap gap-2">{track.skillSignals.slice(0, 4).map((signal) => <Badge key={signal.skill}>{signal.skill}: {signal.state}</Badge>)}</div> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
