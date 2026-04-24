import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Card, EmptyState, ErrorState, Loader, SectionTitle } from '../components/ui';
import type { Capstone, GuidedProject, Lab, Lesson, Track } from '../types';

type PathsResponse = {
  phases: { phase: number; title: string; lessons: Lesson[] }[];
  capstones: Capstone[];
  glossary: Array<{ id: string; term: string; definition: string; category: string }>;
  labs: Lab[];
  tracks: Track[];
  guidedProjects: GuidedProject[];
};

export function LearningPathsPage() {
  const [data, setData] = useState<PathsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadPaths = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<PathsResponse>('/learning/paths');
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'We could not load the learning paths.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPaths();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const careerTracks = useMemo(() => data?.tracks.filter((track) => track.trackType !== 'skill') ?? [], [data]);
  const skillTracks = useMemo(() => data?.tracks.filter((track) => track.trackType === 'skill') ?? [], [data]);
  const totalLessons = useMemo(() => data?.phases.reduce((sum, phase) => sum + phase.lessons.length, 0) ?? 0, [data]);
  const flagshipTrack = careerTracks[0] ?? null;
  const starterPhase = data?.phases[0] ?? null;

  if (loading) {
    return (
      <AppShell>
        <Loader text="Loading learning paths..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState
          title="Learning paths unavailable"
          description={error || 'We could not load the curriculum map.'}
          actionLabel="Retry paths"
          onAction={() => setRefreshKey((value) => value + 1)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Curriculum architecture"
          title="Pick a path on purpose, then move through it without wandering."
          subtitle="Top educational products do not bury the route. They make entry points, prerequisites, milestones, and proof-of-skill outputs obvious before the learner wastes time."
        />

        <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Best place to start</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">{flagshipTrack ? flagshipTrack.title : 'Start with the foundations phase'}</h3>
              </div>
              <Badge>{flagshipTrack?.level || 'beginner'}</Badge>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-slate-300">
              {flagshipTrack
                ? `${flagshipTrack.hero || flagshipTrack.description} This path is the cleanest route when you want direction, milestones, and professional outcomes instead of random consumption.`
                : 'Use the first phase to build your base, then move into specializations when your fundamentals stop being fragile.'}
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Career tracks</p>
                <p className="mt-2 text-2xl font-semibold text-white">{careerTracks.length}</p>
                <p className="mt-2 text-sm text-slate-400">Long-form routes tied to actual role readiness.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Core lessons</p>
                <p className="mt-2 text-2xl font-semibold text-white">{totalLessons}</p>
                <p className="mt-2 text-sm text-slate-400">Structured across five phases instead of scattered topics.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Guided projects</p>
                <p className="mt-2 text-2xl font-semibold text-white">{data.guidedProjects.length}</p>
                <p className="mt-2 text-sm text-slate-400">Where skill turns into visible proof of work.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {starterPhase?.lessons[0] ? <Link to={`/lessons/${starterPhase.lessons[0].slug}`} className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950">Start from phase one</Link> : null}
              <Link to="/practice" className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">Open practice hub</Link>
              <Link to="/tutor" className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">Ask AI tutor what fits you</Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Before you choose</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Use these rules so you do not pick badly.</h3>
              </div>
              <Badge>Decision guide</Badge>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Pick a career track if you want a job-facing route with milestones and proof outputs.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Pick a skill sprint if one weakness is blocking the rest of your progress.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Use guided projects when you need evidence, not just completion ticks.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">If you are still weak in fundamentals, do not cosplay specialization yet. Fix the base first.</div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Career paths</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Long-form routes for role readiness.</h3>
            </div>
            <Badge>{careerTracks.length} career paths</Badge>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {careerTracks.length ? careerTracks.map((track) => (
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
            )) : <EmptyState title="No career tracks available" description="The curriculum map loaded, but there are no role tracks attached yet." />}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Skill sprints</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Short paths for one capability at a time.</h3>
              </div>
              <Badge>{skillTracks.length} skill paths</Badge>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {skillTracks.length ? skillTracks.map((track) => (
                <div key={track.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{track.title}</p>
                    <Badge>{track.estimatedHours || 0} hrs</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{track.hero || track.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{(track.skills || []).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
                  <p className="mt-4 text-sm text-slate-400">Best for: {(track.recommendedFor || track.targetRoles).join(', ')}</p>
                </div>
              )) : <EmptyState title="No skill sprints yet" description="Add focused short-form tracks for learners who need targeted remediation." />}
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
              {data.guidedProjects.length ? data.guidedProjects.map((project) => (
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
              )) : <EmptyState title="No guided projects yet" description="Guided projects should exist here because they are what converts learning into evidence." />}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Core curriculum map</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Five phases, clear ordering, no random hopping.</h3>
            </div>
            <Badge>{totalLessons} total lessons</Badge>
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
              {data.capstones.length ? data.capstones.map((capstone) => (
                <div key={capstone.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{capstone.title}</p>
                    <Badge>{capstone.specialization}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{capstone.summary}</p>
                </div>
              )) : <EmptyState title="No capstones yet" description="Capstone ideas should be here for learners who need portfolio-grade closing work." />}
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
              {data.labs.length ? data.labs.map((lab) => (
                <Link key={lab.id} to={`/labs/${lab.slug}`} className="block rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-sky-400/40">
                  <p className="font-medium text-white">{lab.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{lab.category} · {lab.difficulty}</p>
                </Link>
              )) : <EmptyState title="No labs loaded" description="The curriculum map should expose labs here so practice is not hidden behind guesswork." />}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
