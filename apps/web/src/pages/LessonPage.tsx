import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle } from '../components/ui';
import type { Lesson, QuizResult } from '../types';
import { QuizRenderer } from '../components/QuizRenderer';

export function LessonPage() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [marking, setMarking] = useState(false);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    if (!slug) return;
    api.get<{ lesson: Lesson }>(`/learning/lessons/${slug}`).then((data) => setLesson(data.lesson));
  }, [slug]);

  const quickChecks = useMemo(() => lesson?.knowledgeChecks || [], [lesson]);
  const cheatSheet = useMemo(() => lesson?.glossary.slice(0, 4) || [], [lesson]);

  if (!lesson) return <AppShell><Loader text="Loading lesson..." /></AppShell>;

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      await api.post(`/learning/lessons/${lesson.id}/complete`, { completed: true, timeSpentMinutes: minutes });
      setLesson((prev) => prev ? { ...prev, completed: true, timeSpentMinutes: (prev.timeSpentMinutes || 0) + minutes } : prev);
    } finally {
      setMarking(false);
    }
  };

  const submitQuiz = async (answers: Record<string, any>, durationMinutes: number): Promise<QuizResult> => {
    const response = await api.post<{ result: QuizResult }>('/learning/quizzes/submit', { lessonId: lesson.id, answers, timeSpentMinutes: durationMinutes });
    return response.result;
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle eyebrow={`Phase ${lesson.phase} · ${lesson.phaseTitle}`} title={lesson.title} subtitle={lesson.content} />
          <div className="flex flex-wrap gap-2">
            <Badge>{lesson.level}</Badge>
            <Badge>{lesson.estimatedMinutes} min</Badge>
            <Badge>{lesson.completed ? 'Completed' : 'In progress'}</Badge>
            <Badge>v{lesson.version || 1}</Badge>
            {lesson.revisionCount ? <Badge>{lesson.revisionCount} revisions</Badge> : null}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Learning objectives</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {lesson.learningObjectives.map((objective) => <li key={objective} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">{objective}</li>)}
            </ul>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr,0.9fr]">
              <div>
                <h3 className="text-lg font-semibold text-white">Examples</h3>
                <div className="mt-4 grid gap-3">
                  {lesson.examples.map((example) => <div key={example} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">{example}</div>)}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Lesson map</h3>
                <div className="mt-4 space-y-3">
                  {['Objectives', 'Examples', 'Quick checks', 'Quiz', 'Practice next'].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-xs font-semibold text-slate-200">{index + 1}</div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
              Diagram placeholder: replace with sequence diagrams, trust-boundary visuals, or a small annotated workflow instead of dumping raw text. Top products use visuals to reduce friction. This lesson is ready for that upgrade later.
            </div>

            <h3 className="mt-8 text-lg font-semibold text-white">Quick knowledge checks</h3>
            <div className="mt-4 space-y-3">
              {quickChecks.map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">{item}</div>)}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Cheat sheet</h3>
                <Badge>Fast recall</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {cheatSheet.map((entry) => (
                  <div key={entry.term} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="font-medium text-white">{entry.term}</p>
                    <p className="mt-1 text-sm text-slate-400">{entry.definition}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Lesson governance</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Version: {lesson.version || 1}</div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Last reviewed: {lesson.lastReviewedAt ? new Date(lesson.lastReviewedAt).toLocaleDateString() : 'Not set yet'}</div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Next review due: {lesson.reviewDueAt ? new Date(lesson.reviewDueAt).toLocaleDateString() : 'Not scheduled yet'}</div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">Revision history entries: {lesson.revisionCount || 0}</div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Role paths this lesson supports</h3>
              <div className="mt-4 space-y-3">
                {lesson.relatedTracks?.length ? lesson.relatedTracks.map((track) => (
                  <div key={track.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">{track.title}</p>
                      <Badge>{track.frameworkRef}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{track.hero || track.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.targetRoles.map((role) => <Badge key={role}>{role}</Badge>)}
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-400">This lesson is still treated as core coverage only.</p>}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Common mistakes</h3>
              <p className="mt-3 text-sm text-slate-300">{lesson.commonMistakes}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Why this matters in real work</h3>
              <p className="mt-3 text-sm text-slate-300">{lesson.whyItMatters}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Practice next</h3>
              <p className="mt-2 text-sm text-slate-400">The best products do not end at “lesson complete.” They push you into review, practice, and explanation. Do the same here.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button className="bg-sky-400 text-slate-950" onClick={handleMarkComplete} disabled={marking}>{marking ? 'Saving...' : lesson.completed ? 'Completed' : 'Mark complete'}</Button>
                <Link to="/practice" className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">Open practice hub</Link>
                <Link to="/tutor" className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200">Ask AI tutor</Link>
              </div>
            </Card>
          </div>
        </div>

        <section className="space-y-5">
          <SectionTitle eyebrow="Quiz engine" title="End-of-lesson assessment" subtitle="Immediate feedback, topic scoring, and mistake capture feed your notebook automatically." />
          {lesson.quizQuestions?.length ? <QuizRenderer questions={lesson.quizQuestions} onSubmit={submitQuiz} /> : <Card className="p-5">No quiz attached yet.</Card>}
        </section>
      </div>
    </AppShell>
  );
}
