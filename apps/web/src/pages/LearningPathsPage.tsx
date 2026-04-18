import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Card, Loader, SectionTitle } from '../components/ui';
import type { Capstone, GuidedProject, Lab, Lesson, Track } from '../types';

export function LearningPathsPage() {
  const [data, setData] = useState<{ phases: { phase: number; title: string; lessons: Lesson[] }[]; capstones: Capstone[]; glossary: any[]; labs: Lab[]; tracks: Track[]; guidedProjects: GuidedProject[] } | null>(null);

  useEffect(() => {
    api.get<{ phases: { phase: number; title: string; lessons: Lesson[] }[]; capstones: Capstone[]; glossary: any[]; labs: Lab[]; tracks: Track[]; guidedProjects: GuidedProject[] }>('/learning/paths').then(setData);
  }, []);

  const careerTracks = useMemo(() => data?.tracks.filter((track) => track.trackType !== 'skill') ?? [], [data]);
  const skillTracks = useMemo(() => data?.tracks.filter((track) => track.trackType === 'skill') ?? [], [data]);

  if (!data) return <AppShell><Loader text="Loading paths..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Curriculum"
          title="Career paths, skill sprints, and guided projects."
          subtitle="The strongest products do not just list lessons. They clarify who a path is for, what to do before entering, what evidence you will produce, and what comes next."
        />

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Career paths</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Long-form routes for real role readiness.</h3>
            </div>
            <Badge>{careerTracks.length} career paths</Badge>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {careerTracks.map((track) => (
              <div key={track.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{track.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{track.frameworkRef} · {track.level}</p>
                  </div>
                  <Badge>{track.estimatedHours || 0} hrs</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-300">{track.hero || track.description}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Best entry points</p>
                    <ul className="mt-2 space-y-2 text-slate-300">{(track.entryPoints || []).map((item) => <li key={item}>• {item}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Prerequisites</p>
                    <ul className="mt-2 space-y-2 text-slate-300">{(track.prerequisites || []).map((item) => <li key={item}>• {item}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recommended for</p>
                    <ul className="mt-2 space-y-2 text-slate-300">{(track.recommendedFor || track.targetRoles).map((item) => <li key={item}>• {item}</li>)}</ul>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Milestones</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      {track.milestones.map((milestone) => <li key={milestone}>• {milestone}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Outcomes</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      {(track.outcomes || []).map((outcome) => <li key={outcome}>• {outcome}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(track.skills || []).map((skill) => <Badge key={skill}>{skill}</Badge>)}
                </div>
                <p className="mt-4 text-xs text-slate-500">Mapped lessons: {track.lessonLinks?.length || track.lessonCount || 0}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Skill paths</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Short sprints for one capability.</h3>
              </div>
              <Badge>{skillTracks.length} skill paths</Badge>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {skillTracks.map((track) => (
                <div key={track.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{track.title}</p>
                    <Badge>{track.estimatedHours || 0} hrs</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{track.hero || track.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{(track.skills || []).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
                  <p className="mt-4 text-sm text-slate-400">Best for: {(track.recommendedFor || track.targetRoles).join(', ')}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Guided projects</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Applied work that creates proof.</h3>
              </div>
              <Badge>{data.guidedProjects.length} guided projects</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {data.guidedProjects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{project.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{project.specialization} · {project.difficulty}</p>
                    </div>
                    <Badge>{project.estimatedHours} hrs</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{project.summary}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Checkpoints</p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-300">{project.checkpoints.map((item) => <li key={item}>• {item}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Rubric</p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-300">{project.rubric.map((item) => <li key={item}>• {item}</li>)}</ul>
                    </div>
                  </div>
                  {project.starterLessonSlug ? <Link to={`/lessons/${project.starterLessonSlug}`} className="mt-4 inline-flex text-sm text-sky-300">Start from anchor lesson</Link> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Core curriculum map</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Five phases, clear lesson ordering.</h3>
            </div>
            <Badge>{data.phases.reduce((sum, phase) => sum + phase.lessons.length, 0)} total lessons</Badge>
          </div>
          <div className="mt-5 space-y-5">
            {data.phases.map((phase) => (
              <div key={phase.phase} className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Phase {phase.phase}</p>
                    <h3 className="text-2xl font-semibold text-white">{phase.title}</h3>
                  </div>
                  <Badge>{phase.lessons.length} lessons</Badge>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {phase.lessons.map((lesson) => (
                    <Link key={lesson.id} to={`/lessons/${lesson.slug}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40">
                      <p className="font-medium text-white">{lesson.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{lesson.level} · {lesson.estimatedMinutes} min · v{lesson.version || 1}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{lesson.specialization || 'core'}</Badge>
                        {lesson.reviewDueAt ? <Badge>review scheduled</Badge> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Capstones</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Longer portfolio-ready ideas.</h3>
              </div>
              <Badge>{data.capstones.length} capstones</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {data.capstones.map((capstone) => (
                <div key={capstone.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{capstone.title}</p>
                    <Badge>{capstone.specialization}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{capstone.summary}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Labs and glossary</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Applied practice stays defensive.</h3>
              </div>
              <Link to="/labs" className="text-sm text-sky-300">Open labs</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{data.glossary.slice(0, 16).map((term) => <Badge key={term.term}>{term.term}</Badge>)}</div>
            <div className="mt-5 space-y-3">
              {data.labs.map((lab) => (
                <Link key={lab.id} to={`/labs/${lab.slug}`} className="block rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40">
                  <p className="font-medium text-white">{lab.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{lab.category} · {lab.difficulty}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
