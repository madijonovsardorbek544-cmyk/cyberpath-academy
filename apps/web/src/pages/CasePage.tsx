import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { DiscussionPanel } from "../components/discussion/DiscussionPanel";
import { Badge, Button, Card, ErrorMessage, ErrorState, Input, Loader } from "../components/ui";
import { EvidenceViewer } from "../components/cases/EvidenceViewer";
import type { CaseAnswerResponse, CaseDetailResponse, CaseQuestionState } from "../types";

function QuestionCard({ question, index, onAnswer }: { question: CaseQuestionState; index: number; onAnswer: (questionId: string, answer: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [failure, setFailure] = useState("");
  const inputId = `case-answer-${question.id}`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setFailure("");
    try {
      setWrong(!(await onAnswer(question.id, value)));
    } catch (err) {
      setFailure((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={`p-5 ${question.solved ? "border-emerald-400/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-white"><span className="text-slate-500">Q{index + 1}.</span> {question.prompt}</h3>
        <span className="shrink-0 font-mono text-xs text-slate-400">{question.solved ? `+${question.pointsAwarded}` : question.points} pts</span>
      </div>
      {question.solved ? (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300"><CheckCircle2 size={16} aria-hidden="true" /> Solved</p>
          <p className="text-sm text-slate-300">{question.explanation}</p>
        </div>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={submit}>
          {question.options ? (
            <fieldset className="space-y-2">
              <legend className="sr-only">{question.prompt}</legend>
              {question.options.map((option) => (
                <label key={option} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-600">
                  <input type="radio" name={inputId} value={option} checked={value === option} onChange={() => setValue(option)} className="mt-1 accent-sky-400" />
                  {option}
                </label>
              ))}
            </fieldset>
          ) : (
            <>
              <label htmlFor={inputId} className="text-xs text-slate-400">Answer format: {question.format}</label>
              <Input id={inputId} value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" spellCheck={false} className="font-mono" aria-describedby={wrong ? `${inputId}-error` : undefined} />
            </>
          )}
          {failure ? <ErrorMessage>{failure}</ErrorMessage> : null}
          {wrong ? <ErrorMessage id={`${inputId}-error`}>Not quite. Check the evidence again{question.options ? ". A correct pick after a wrong one earns half points." : "."}</ErrorMessage> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy || !value.trim()} className="bg-sky-400 text-slate-950">{busy ? "Checking..." : "Submit answer"}</Button>
            <Button type="button" onClick={() => setShowHint((shown) => !shown)} className="border border-slate-700 text-slate-200" aria-expanded={showHint}>
              <span className="flex items-center gap-2"><Lightbulb size={16} aria-hidden="true" /> {showHint ? "Hide hint" : "Hint"}</span>
            </Button>
            {question.attempts > 0 ? <span className="text-xs text-slate-500">{question.attempts} {question.attempts === 1 ? "attempt" : "attempts"}</span> : null}
          </div>
          {showHint ? <p className="rounded-2xl bg-slate-950/60 px-3 py-2 text-sm text-slate-300">{question.hint}</p> : null}
        </form>
      )}
    </Card>
  );
}

export function CasePage() {
  const { slug } = useParams();
  const [data, setData] = useState<CaseDetailResponse | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    if (!slug) return;
    setError("");
    api.get<CaseDetailResponse>(`/cases/${slug}`).then(setData).catch((err: Error) => setError(err.message));
  };
  useEffect(load, [slug]);

  const answer = async (questionId: string, value: string) => {
    const result = await api.post<CaseAnswerResponse>(`/cases/${slug}/answer`, { questionId, answer: value });
    setData({ case: result.case, progress: result.progress });
    return result.correct;
  };

  if (error) return <AppShell><ErrorState title="Could not load this case" description={error} onAction={load} /></AppShell>;
  if (!data) return <AppShell><Loader text="Opening case file..." /></AppShell>;
  const { case: item, progress } = data;
  const percent = Math.round((progress.pointsEarned / progress.totalPoints) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        {slug?.startsWith("event-") ? <Link to="/event" className="text-sm text-sky-300 hover:text-sky-200">← Event calendar</Link> : <Link to="/cases" className="text-sm text-sky-300 hover:text-sky-200">← All investigations</Link>}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2"><Badge>{item.category}</Badge><Badge>{item.difficulty}</Badge><Badge>~{item.estimatedMinutes} min</Badge></div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{item.title}</h1>
          <p className="max-w-3xl text-slate-300">{item.story}</p>
          <div className="flex flex-wrap gap-2">{item.skills.map((skill) => <Badge key={skill} className="border-sky-400/30 text-sky-200">{skill}</Badge>)}</div>
          <div className="max-w-md">
            <div className="flex justify-between text-xs text-slate-400"><span>{progress.solvedQuestions} of {progress.totalQuestions} answered</span><span>{progress.pointsEarned} / {progress.totalPoints} pts</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Case points"><div className="h-full rounded-full bg-sky-400" style={{ width: `${percent}%` }} /></div>
          </div>
        </div>

        {item.debrief ? (
          <Card className="border-emerald-400/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Case closed · debrief</p>
            <p className="mt-3 text-slate-200">{item.debrief}</p>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <EvidenceViewer evidence={item.evidence} />
          <div className="min-w-0 space-y-4">
            {item.questions.map((question, index) => <QuestionCard key={question.id} question={question} index={index} onAnswer={answer} />)}
          </div>
        </div>
        {slug ? <DiscussionPanel targetType="case" slug={slug} refreshKey={progress.completed} /> : null}
        <p className="text-xs text-slate-500">All people, companies, domains and IP addresses in this case are fictional or reserved for documentation.</p>
      </div>
    </AppShell>
  );
}
