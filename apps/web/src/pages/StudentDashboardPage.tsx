import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, EmptyState, ErrorState, Loader, SectionTitle, StatCard } from '../components/ui';
import type { DashboardResponse } from '../types';

type RecommendationCard = {
  id: string;
  title: string;
  copy: string;
  href: string;
  label: string;
};

export function StudentDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [claimingCertificates, setClaimingCertificates] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<DashboardResponse>('/learning/dashboard');
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'We could not load your dashboard right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const nextLesson = useMemo(() => {
    if (!data) return null;
    return data.practiceHub.continueLesson ?? data.nextLessons.find((lesson) => !lesson.completed) ?? data.nextLessons[0] ?? null;
  }, [data]);

  const weakTopics = useMemo(() => {
    if (!data) return [];
    return [...data.analytics.topicAccuracy]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
  }, [data]);

  const nextMoves = useMemo<RecommendationCard[]>(() => {
    if (!data) return [];

    const cards: RecommendationCard[] = [];

    if (nextLesson) {
      cards.push({
        id: 'continue-lesson',
        title: `Continue ${nextLesson.title}`,
        copy: `Stay in the flow. ${nextLesson.estimatedMinutes} focused minutes now is worth more than vague studying later.`,
        href: `/lessons/${nextLesson.slug}`,
        label: 'Resume lesson'
      });
    }

    if (data.dueReviews[0]) {
      cards.push({
        id: 'due-review',
        title: `Clear review debt in ${data.dueReviews[0].topic}`,
        copy: `You have ${data.dueReviews.length} review item${data.dueReviews.length === 1 ? '' : 's'} due. Skipping these is how forgetting wins.`,
        href: '/practice',
        label: 'Open practice hub'
      });
    }

    if (weakTopics[0]) {
      cards.push({
        id: 'weak-topic',
        title: `Repair ${weakTopics[0].topic}`,
        copy: `This is one of your weakest topics at ${weakTopics[0].accuracy}% accuracy. Fixing weak spots changes your ceiling.`,
        href: '/mistakes',
        label: 'Review mistakes'
      });
    }

    if (!cards.length) {
      cards.push({
        id: 'explore-paths',
        title: 'Choose your next path on purpose',
        copy: 'You need a concrete target. Pick a path, then turn that into lessons, practice, and proof.',
        href: '/paths',
        label: 'View learning paths'
      });
    }

    return cards.slice(0, 3);
  }, [data, nextLesson, weakTopics]);

  const claimCertificates = async () => {
    setClaimingCertificates(true);
    try {
      const response = await api.post<{ certificates: DashboardResponse['certificates'] }>('/learning/certificates/claim');
      setData((prev) => (prev ? { ...prev, certificates: response.certificates } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not claim certificates right now.');
    } finally {
      setClaimingCertificates(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <Loader text="Loading your learning operating system..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState
          title="Dashboard unavailable"
          description={error || 'We could not load the dashboard.'}
          actionLabel="Retry dashboard"
          onAction={() => setRefreshKey((value) => value + 1)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Student command center"
          title="Know your next move, your weak spots, and your proof of progress."
          subtitle="Top learning products do not dump features on a page. They tell you exactly what matters now, why it matters, and what to do after that."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Lessons completed" value={data.analytics.totalCompleted} hint={`${data.analytics.completionRate}% of the mapped curriculum`} />
          <StatCard label="Quiz accuracy" value={`${data.analytics.totalQuizAccuracy}%`} hint="Average across recorded attempts" />
          <StatCard label="Time studied" value={`${data.analytics.timeStudied} min`} hint={`Streak ${data.analytics.streakDays} day${data.analytics.streakDays === 1 ? '' : 's'}`} />
          <StatCard label="Review pressure" value={data.dueReviews.length} hint={data.dueReviews.length ? 'Do not let forgetting compound.' : 'No review debt right now.'} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Do this now</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">{nextLesson ? nextLesson.title : 'Build momentum with a deliberate next step'}</h3>
              </div>
              <Badge>{nextLesson?.phaseTitle || 'Next action'}</Badge>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-slate-300">
              {nextLesson
                ? `${nextLesson.estimatedMinutes} minutes. Finish the lesson, take the quiz seriously, then clear one review action so the learning actually sticks.`
                : 'You do not need more random browsing. Choose a path, start one lesson, and create evidence.'}
            </p>
            {data.practiceHub.recoveryPlan ? (
              <div className="mt-5 rounded-3xl border border-amber-400/25 bg-amber-400/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-amber-100">{data.practiceHub.recoveryPlan.title}</p>
                  <Badge className="border-amber-400/35 text-amber-200">recovery mode</Badge>
                </div>
                <p className="mt-2 text-sm text-amber-100/85">{data.practiceHub.recoveryPlan.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-amber-50/90">
                  {data.practiceHub.recoveryPlan.actions.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {nextLesson ? <Link to={`/lessons/${nextLesson.slug}`}><Button className="bg-sky-400 text-slate-950">Resume lesson</Button></Link> : null}
              <Link to="/practice"><Button className="border border-slate-700 bg-slate-900 text-white">Open practice hub</Button></Link>
              <Link to="/paths"><Button className="border border-slate-700 bg-slate-900 text-white">Review all learning paths</Button></Link>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {nextMoves.map((item) => (
                <Link key={item.id} to={item.href} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40 hover:bg-slate-950">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Priority move</p>
                  <p className="mt-2 font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
                  <p className="mt-4 text-sm text-sky-300">{item.label}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Weak-topic pressure</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Where you leak points right now</h3>
              </div>
              <Badge>{weakTopics.length ? `${weakTopics.length} priority topics` : 'Stable'}</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {weakTopics.length ? weakTopics.map((topic) => (
                <div key={topic.topic} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{topic.topic}</p>
                    <Badge className={topic.accuracy < 60 ? 'border-rose-400/35 text-rose-200' : 'border-amber-400/35 text-amber-200'}>{topic.accuracy}% accuracy</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Do not admire the weakness. Fix it with targeted quiz review, mistakes analysis, and one more clean attempt.</p>
                </div>
              )) : <EmptyState title="No weak-topic alert yet" description="Get a few more quiz attempts in and the dashboard will start identifying what needs correction." />}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Topic accuracy</h3>
                <p className="mt-1 text-sm text-slate-400">This is where the score story becomes concrete.</p>
              </div>
              <Badge>{data.analytics.topicAccuracy.length} tracked topics</Badge>
            </div>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Skill radar</h3>
                <p className="mt-1 text-sm text-slate-400">A faster read on breadth versus imbalance.</p>
              </div>
              <Badge>{data.mastery.length} mastery lanes</Badge>
            </div>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Adaptive next steps</h3>
                <p className="mt-1 text-sm text-slate-400">Your recommendations should be specific, not motivational wallpaper.</p>
              </div>
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
              )) : <EmptyState title="No adaptive recommendations yet" description="Complete more lessons and quizzes so the platform has enough signal to guide you precisely." />}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Review queue and assignments</h3>
                <p className="mt-1 text-sm text-slate-400">This is the work that protects retention and accountability.</p>
              </div>
              <Badge>{data.assignments.length + data.dueReviews.length} active items</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {data.dueReviews.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.topic}</p>
                    <Badge>{item.successStreak} streak</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.prompt}</p>
                </div>
              ))}
              {data.assignments.slice(0, 2).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.title}</p>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.instructions}</p>
                </div>
              ))}
              {!data.assignments.length && !data.dueReviews.length ? <EmptyState title="No pressure items right now" description="That is good, but do not let the dashboard go quiet. Start another focused lesson today." /> : null}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Portfolio and guided projects</h3>
                <p className="mt-1 text-sm text-slate-400">Proof beats claims. Build artifacts that survive scrutiny.</p>
              </div>
              <Link to="/paths" className="text-sm text-sky-300">Explore projects</Link>
            </div>
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
              )) : <EmptyState title="No portfolio artifacts yet" description="Start one guided project or publish one artifact so your learning creates visible proof." />}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Certificates and mastery states</h3>
                <p className="mt-1 text-sm text-slate-400">These only matter if they rest on real work and measured readiness.</p>
              </div>
              <Button className="bg-sky-400 text-slate-950" disabled={claimingCertificates} onClick={claimCertificates}>{claimingCertificates ? 'Claiming...' : 'Claim eligible'}</Button>
            </div>
            <div className="mt-4 space-y-3">
              {data.certificates.length ? data.certificates.map((certificate) => (
                <div key={certificate.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="font-medium text-white">{certificate.title}</p>
                  <p className="mt-1 text-sm text-slate-400">Issued: {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Pending issuance'}</p>
                  <p className="mt-2 text-xs text-slate-500">Criteria: {certificate.criteria.score}% mastery · {certificate.criteria.completionRate}% completion · {certificate.criteria.quizAverage}% quiz average</p>
                </div>
              )) : <EmptyState title="No certificates yet" description="That is normal. Earn them through completed work, cleaner quiz performance, and stronger mastery." />}
              <div className="space-y-3 pt-2">
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
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
