import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { DiscussionPanel } from "../components/discussion/DiscussionPanel";
import { Badge, Button, Card, ErrorMessage, ErrorState, Input, Loader } from "../components/ui";
import type { CaseAnswerResponse, CaseDetailResponse, CaseEvidence, CaseQuestionState } from "../types";

const ShellTerminal = lazy(() => import("../components/terminal/ShellTerminal").then((module) => ({ default: module.ShellTerminal })));
const terminalBanner = ["Read-only analyst shell. Evidence files are in this folder.", "Try: ls, then grep, awk, sort | uniq -c. Type help for all commands."];

function EvidenceViewer({ evidence }: { evidence: CaseEvidence[] }) {
  const [activeId, setActiveId] = useState(evidence[0]?.id);
  const [query, setQuery] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [mode, setMode] = useState<"viewer" | "terminal">("viewer");
  const active = evidence.find((item) => item.id === activeId) ?? evidence[0];
  const caseFs = useMemo(() => ({ case: Object.fromEntries(evidence.map((item) => [item.name, item.content])) }), [evidence]);

  const lines = useMemo(() => active.content.split("\n").map((text, index) => ({ number: index + 1, text })), [active]);
  const needle = query.trim().toLowerCase();
  const matches = needle ? lines.filter((line) => line.text.toLowerCase().includes(needle)) : [];
  const shown = needle && onlyMatches ? matches : lines;

  return (
    <Card className="min-w-0 p-5 xl:sticky xl:top-28 xl:self-start">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">Evidence</h2>
        <div className="flex rounded-2xl border border-slate-700 p-1 text-sm" role="group" aria-label="Evidence tool">
          {(["viewer", "terminal"] as const).map((option) => (
            <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)} className={`rounded-xl px-3 py-1 capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${mode === option ? "bg-sky-400 text-slate-950" : "text-slate-300"}`}>{option}</button>
          ))}
        </div>
      </div>
      {mode === "terminal" ? (
        <div className="mt-3">
          <Suspense fallback={<Loader text="Starting terminal..." />}>
            <ShellTerminal fs={caseFs} home="/case" banner={terminalBanner} label="Evidence terminal" />
          </Suspense>
        </div>
      ) : (<>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Evidence files">
        {evidence.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === active.id}
            onClick={() => setActiveId(item.id)}
            className={`rounded-xl border px-3 py-2 font-mono text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${item.id === active.id ? "border-sky-400/60 bg-sky-400/10 text-sky-100" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-400">{active.description}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="evidence-search" className="sr-only">Search this file</label>
        <Input id="evidence-search" placeholder="Search this file, e.g. 203.0.113.45" value={query} onChange={(event) => setQuery(event.target.value)} className="font-mono" />
        <label className="flex shrink-0 items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={onlyMatches} onChange={(event) => setOnlyMatches(event.target.checked)} className="h-4 w-4 accent-sky-400" />
          Only matching lines
        </label>
      </div>
      {needle ? <p className="mt-2 text-xs text-slate-400" aria-live="polite">{matches.length} matching {matches.length === 1 ? "line" : "lines"}</p> : null}
      <div className="mt-3 max-h-[560px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-3" tabIndex={0} aria-label={`${active.name} contents`}>
        <pre className="font-mono text-xs leading-6 text-slate-200">
          {shown.map((line) => {
            const hit = needle && line.text.toLowerCase().includes(needle);
            return (
              <div key={line.number} className={hit ? "bg-amber-300/15" : undefined}>
                <span className="mr-3 inline-block w-8 select-none text-right text-slate-600">{line.number}</span>
                {line.text}
              </div>
            );
          })}
        </pre>
      </div>
      </>)}
    </Card>
  );
}

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
