import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle } from '../components/ui';
import type { PracticeHub } from '../types';

export function PracticeHubPage() {
  const [data, setData] = useState<PracticeHub | null>(null);

  useEffect(() => {
    api.get<{ practiceHub: PracticeHub }>('/learning/practice-hub').then((response) => setData(response.practiceHub));
  }, []);

  if (!data) return <AppShell><Loader text="Loading practice hub..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Practice hub"
          title="Daily focus, spaced review, and mastery challenges."
          subtitle="This is the product layer strong education apps get right: clear continuation, targeted review, and short high-value actions instead of dumping you into a giant content list."
        />

        <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Today</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{data.dailyQuest.title}</h3>
              </div>
              <Badge>{data.dailyQuest.progress}/{data.dailyQuest.total} done</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-400">Reward: {data.dailyQuest.rewardLabel}</p>
            <div className="mt-5 space-y-3">
              {data.dailyQuest.steps.map((step, index) => (
                <Link key={step.id} to={step.href} className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40">
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${step.done ? 'border-emerald-400/50 text-emerald-200' : 'border-slate-700 text-slate-300'}`}>{index + 1}</div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{step.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{step.done ? 'Already cleared.' : 'High-value next action.'}</p>
                  </div>
                  <Badge>{step.done ? 'done' : 'next'}</Badge>
                </Link>
              ))}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Streak</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{data.streak.days} day streak</h3>
                </div>
                <Badge>Next milestone {data.streak.nextMilestone}</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {data.streak.daysRemaining === 0
                  ? 'You are sitting on a milestone right now. Keep the chain alive with one real learning action.'
                  : `${data.streak.daysRemaining} day${data.streak.daysRemaining === 1 ? '' : 's'} to your next milestone.`}
              </p>
              {data.continueLesson ? (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Continue learning</p>
                  <p className="mt-2 font-medium text-white">{data.continueLesson.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{data.continueLesson.phaseTitle} · {data.continueLesson.estimatedMinutes} min</p>
                  <Link to={`/lessons/${data.continueLesson.slug}`} className="mt-4 inline-flex rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950">Continue lesson</Link>
                </div>
              ) : null}
            </Card>

            {data.recoveryPlan ? (
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Recovery plan</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{data.recoveryPlan.title}</h3>
                  </div>
                  <Badge>Get back on track</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-400">{data.recoveryPlan.summary}</p>
                <div className="mt-4 space-y-2">
                  {data.recoveryPlan.actions.map((action) => (
                    <div key={action} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">{action}</div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {data.activeProject ? (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Guided project</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{data.activeProject.project.title}</h3>
              </div>
              <Badge>{data.activeProject.status.replace('_', ' ')}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-400">{data.activeProject.project.summary}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Project checkpoints</p>
                <div className="mt-3 space-y-2">
                  {data.activeProject.project.checkpoints.map((checkpoint) => (
                    <div key={checkpoint} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 px-3 py-2">
                      <span>{checkpoint}</span>
                      <Badge>{(data.activeProject?.checkpointProgress ?? []).includes(checkpoint) ? 'done' : 'open'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Why this matters</p>
                <p className="mt-3">Top learning products do not stop at quizzes. They force learners to produce evidence. This project is where your skills stop being theoretical.</p>
                <Link to="/dashboard" className="mt-4 inline-flex rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">Open dashboard evidence</Link>
              </div>
            </div>
          </Card>
        ) : null}

        {data.assignments?.length ? (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Mentor assignments</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Targeted work you still owe.</h3>
              </div>
              <Badge>{data.assignments.length} active</Badge>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {data.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{assignment.title}</p>
                    <Badge>{assignment.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{assignment.instructions}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    {assignment.targetMastery ? <span>Target mastery {assignment.targetMastery}%</span> : null}
                    {assignment.dueAt ? <span>Due {new Date(assignment.dueAt).toLocaleDateString()}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          {data.focusAreas.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <Badge>{item.badge}</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-400">{item.description}</p>
              <Link to={item.href} className="mt-5 inline-flex rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">{item.actionLabel}</Link>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Review queue</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Choose the fastest useful rep.</h3>
            </div>
            <Link to="/paths"><Button className="border border-slate-700 bg-slate-900 text-white">See all paths</Button></Link>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {data.reviewQueue.map((item) => (
              <Link key={item.id} to={item.href} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{item.title}</p>
                  <Badge>{item.badge}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-400">{item.description}</p>
                <p className="mt-4 text-sm text-sky-300">{item.actionLabel}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Path spotlight</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Career paths and short skill paths.</h3>
            </div>
            <Badge>Inspired by the best path-based products, but tuned for cyber learning</Badge>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {data.paths.map((path) => (
              <div key={path.trackSlug} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{path.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{path.trackType} path · {path.estimatedHours} hours</p>
                  </div>
                  <Badge>{path.score}% mastery</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-300">{path.hero}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(path.score, 6)}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>Completion {path.completionRate}%</span>
                  <span>Quiz average {path.quizAverage}%</span>
                  <span>Band {path.band}</span>
                  {path.reviewDueCount ? <span>{path.reviewDueCount} due review</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
