import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle, Textarea } from '../components/ui';
import type { Exercise, PracticeFeedback, PracticeMode, PracticeSession } from '../types';

function defaultAnswer(exercise: Exercise): unknown {
  if (Array.isArray(exercise.correctAnswer)) return [];
  if (exercise.type === 'matching') return exercise.correctAnswer ?? {};
  return '';
}

export function PracticeSessionPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>('');
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [showHints, setShowHints] = useState(0);
  const mode = (params.get('mode') as PracticeMode) || 'practice';
  const skillId = params.get('skillId');
  useEffect(() => { api.get<{ session: PracticeSession }>(`/learning/practice/session?mode=${mode}${skillId ? `&skillId=${skillId}` : ''}`).then((res) => { setSession(res.session); setAnswer(defaultAnswer(res.session.exercises[0])); }); }, [mode, skillId]);
  const exercise = useMemo(() => session?.exercises[index], [session, index]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!exercise) return;
    const res = await api.post<{ feedback: PracticeFeedback }>('/learning/practice/submit', { sessionId: session?.id, exerciseId: exercise.id, answer, mode });
    setFeedback(res.feedback);
  };
  const next = () => {
    if (!session) return;
    const nextIndex = Math.min(session.exercises.length - 1, index + 1);
    setIndex(nextIndex); setFeedback(null); setShowHints(0); setAnswer(defaultAnswer(session.exercises[nextIndex]));
  };
  if (!session || !exercise) return <AppShell><Loader text="Building adaptive practice..." /></AppShell>;
  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow={`${mode.replace('_', ' ')} mode`} title={session.skillTitle} subtitle="Answer safe defensive questions. Feedback explains the concept, what to review, and how mastery changed." />
        <Card className="p-6">
          <div className="flex flex-wrap justify-between gap-3"><Badge>Question {index + 1} of {session.exercises.length}</Badge><Badge>{exercise.type.replace('_', ' ')} · difficulty {exercise.difficulty}</Badge></div>
          <p className="mt-4 text-sm text-slate-400">{exercise.scenario}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{exercise.prompt}</h2>
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {Array.isArray(exercise.options) ? (
              <div className="grid gap-3">
                {exercise.options.map((option: string) => {
                  const multi = Array.isArray(exercise.correctAnswer);
                  const checked = multi ? (answer as string[]).includes(option) : answer === option;
                  return <label key={option} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-200"><input type={multi ? 'checkbox' : 'radio'} checked={checked} onChange={() => setAnswer(multi ? (checked ? (answer as string[]).filter((item) => item !== option) : [...((answer as string[]) || []), option]) : option)} />{option}</label>;
                })}
              </div>
            ) : <Textarea value={typeof answer === 'string' ? answer : JSON.stringify(answer)} onChange={(event) => setAnswer(event.target.value)} placeholder="Write a concise defensive answer." />}
            <div className="flex flex-wrap gap-3"><Button className="bg-sky-400 text-slate-950">Submit answer</Button><Button type="button" className="border border-slate-700 bg-slate-900 text-white" onClick={() => setShowHints(Math.min(exercise.hints.length, showHints + 1))}>Show hint</Button></div>
          </form>
          {showHints ? <div className="mt-4 space-y-2">{exercise.hints.slice(0, showHints).map((hint) => <p key={hint} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">Hint: {hint}</p>)}</div> : null}
        </Card>
        {feedback ? <Card className="p-6"><Badge className={feedback.isCorrect ? 'border-emerald-400/50 text-emerald-100' : 'border-rose-400/50 text-rose-100'}>{feedback.isCorrect ? 'correct' : 'review needed'} · {feedback.scoreDelta > 0 ? '+' : ''}{feedback.scoreDelta} mastery</Badge><p className="mt-4 text-slate-300">{feedback.explanation}</p>{feedback.wrongAnswerReason ? <p className="mt-3 text-sm text-rose-100">Why this missed: {feedback.wrongAnswerReason}</p> : null}<p className="mt-3 text-sm text-slate-400">Review: <Link className="text-sky-300" to={`/lessons/${feedback.relatedLessonSlug}`}>{feedback.relatedLessonSlug}</Link></p><div className="mt-5 flex gap-3"><Button className="bg-sky-400 text-slate-950" onClick={next} disabled={index >= session.exercises.length - 1}>Next question</Button><Link to="/skill-tree"><Button className="border border-slate-700 bg-slate-900 text-white">Back to skill tree</Button></Link></div></Card> : null}
      </div>
    </AppShell>
  );
}
