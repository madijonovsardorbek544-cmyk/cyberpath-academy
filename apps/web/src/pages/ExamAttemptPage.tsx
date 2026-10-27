import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { EvidenceViewer } from "../components/cases/EvidenceViewer";
import { Badge, Button, Card, ErrorMessage, ErrorState, Input, Loader } from "../components/ui";
import type { ExamAttempt, ExamScoreLine } from "../types";

const SAVE_DELAY_MS = 1200;

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ScoreLines({ title, lines, earned, max }: { title: string; lines: ExamScoreLine[]; earned: number; max: number }) {
  return (
    <Card className="p-5">
      <h2 className="flex justify-between text-lg font-semibold text-white"><span>{title}</span><span className="font-mono text-sm text-slate-300">{earned} / {max}</span></h2>
      <ul className="mt-3 space-y-2">
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3 text-sm text-slate-300"><span>{line.title ?? line.label}</span><span className="font-mono text-xs">{line.earned} / {line.max}</span></li>
        ))}
      </ul>
    </Card>
  );
}

function ResultView({ attempt }: { attempt: ExamAttempt }) {
  const result = attempt.result!;
  return (
    <div className="space-y-6">
      {attempt.status === "submitted" ? (
        <Card className="p-5"><p className="text-slate-200">Submitted. A mentor will grade your incident report against the rubric. Your evidence score is below; the final result appears here after grading.</p></Card>
      ) : (
        <Card className={`p-5 ${result.passed ? "border-emerald-400/40" : "border-amber-400/40"}`}>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Result</p>
          <p className={`mt-2 text-2xl font-semibold ${result.passed ? "text-emerald-200" : "text-amber-100"}`}>{result.passed ? "Passed" : "Not passed this time"} · {attempt.totalScore} / 100</p>
          {attempt.certificateCode ? <p className="mt-2 text-sm text-slate-300">Certificate code <Link to={`/verify/${attempt.certificateCode}`} className="font-mono text-sky-300 hover:text-sky-200">{attempt.certificateCode}</Link>. Anyone can check it on the verification page.</p> : null}
          {result.reviewerNote ? <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-950/60 p-3 text-sm text-slate-200"><span className="font-medium">Mentor note:</span> {result.reviewerNote}</p> : null}
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreLines title="Evidence sections" lines={result.sections} earned={result.autoScore} max={result.autoMax} />
        {result.report ? <ScoreLines title="Incident report" lines={result.report} earned={result.reportScore ?? 0} max={result.reportMax} /> : null}
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white">Your report</h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-300">{attempt.report || "No report was written."}</p>
      </Card>
    </div>
  );
}

export function ExamAttemptPage() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState("");
  const [tab, setTab] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [saveState, setSaveState] = useState<"saved" | "pending" | "saving" | "failed">("saved");
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef<{ answers?: Record<string, string>; report?: string }>({});
  const timer = useRef<number | undefined>(undefined);
  const autoSubmitted = useRef(false);

  const load = useCallback(() => {
    setError("");
    api.get<{ attempt: ExamAttempt }>(`/exams/attempts/${id}`).then(({ attempt: loaded }) => {
      setAttempt(loaded);
      setAnswers(loaded.answers);
      setReport(loaded.report);
    }).catch((err: Error) => setError(err.message));
  }, [id]);
  useEffect(load, [load]);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    const body = pending.current;
    if (!body.answers && body.report === undefined) return;
    pending.current = {};
    setSaveState("saving");
    try {
      await api.patch(`/exams/attempts/${id}`, body);
      setSaveState(pending.current.answers || pending.current.report !== undefined ? "pending" : "saved");
    } catch {
      // Keep the unsaved changes so the next edit or retry sends them again.
      pending.current = { answers: { ...body.answers, ...pending.current.answers }, report: pending.current.report ?? body.report };
      setSaveState("failed");
    }
  }, [id]);

  const queueSave = (change: { answers?: Record<string, string>; report?: string }) => {
    pending.current = { answers: change.answers ? { ...pending.current.answers, ...change.answers } : pending.current.answers, report: change.report ?? pending.current.report };
    setSaveState("pending");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
  };

  const inProgress = attempt?.status === "in_progress";
  const remaining = attempt ? Date.parse(attempt.deadlineAt) - now : 0;

  useEffect(() => {
    if (!inProgress) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [inProgress]);

  const submit = useCallback(async (auto: boolean) => {
    if (!auto && !window.confirm("Submit now? You cannot change answers afterwards.")) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await flush();
      const result = await api.post<{ attempt: ExamAttempt }>(`/exams/attempts/${id}/submit`);
      setAttempt(result.attempt);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [flush, id]);

  useEffect(() => {
    // One automatic try; if it fails the server still submits the attempt on the next load.
    if (inProgress && remaining <= 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit(true);
    }
  }, [inProgress, remaining, submit]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (saveState !== "saved") event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  if (error) return <AppShell><ErrorState title="Could not open this attempt" description={error} onAction={load} /></AppShell>;
  if (!attempt) return <AppShell><Loader text="Opening the exam..." /></AppShell>;

  const { exam } = attempt;
  const sections = exam.sections;
  const answered = sections.reduce((sum, section) => sum + section.questions.filter((question) => answers[`${section.id}.${question.id}`]?.trim()).length, 0);
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const tabs = [...sections.map((section) => section.title.split(":")[0]), "Report"];
  const section = sections[tab];
  const lowTime = remaining < 10 * 60 * 1000;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/exam" className="text-sm text-sky-300 hover:text-sky-200">← Exam overview</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{exam.title}</h1>
            <p className="text-slate-300">{exam.scenario}</p>
          </div>
          {inProgress ? (
            <Card className={`z-10 p-4 sm:sticky sm:top-28 ${lowTime ? "border-amber-400/50" : ""}`}>
              <p className="flex items-center gap-2 font-mono text-2xl text-white" aria-live={lowTime ? "polite" : "off"}><Clock size={20} aria-hidden="true" /> {formatRemaining(remaining)}</p>
              <p className="mt-1 text-xs text-slate-400">{answered} of {totalQuestions} answered · {report.trim().length} report characters</p>
              <p className="mt-1 text-xs" role="status">{{ saved: "All changes saved", pending: "Unsaved changes", saving: "Saving...", failed: "Could not save. Retrying on your next change." }[saveState]}</p>
            </Card>
          ) : null}
        </div>

        {!inProgress ? <ResultView attempt={attempt} /> : (
          <>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Exam sections">
              {tabs.map((label, index) => (
                <button key={label} type="button" role="tab" aria-selected={tab === index} onClick={() => { void flush(); setTab(index); }} className={`rounded-2xl border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${tab === index ? "border-sky-400/60 bg-sky-400/10 text-sky-100" : "border-slate-700 text-slate-300"}`}>{label}</button>
              ))}
            </div>

            {section ? (
              <div key={section.id} className="space-y-4">
                <div><h2 className="text-xl font-semibold text-white">{section.title}</h2><p className="mt-1 text-slate-300">{section.brief}</p></div>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <EvidenceViewer evidence={section.evidence} />
                  <div className="min-w-0 space-y-4">
                    {section.questions.map((question, index) => {
                      const key = `${section.id}.${question.id}`;
                      const inputId = `exam-${section.id}-${question.id}`;
                      const set = (value: string) => { setAnswers((current) => ({ ...current, [key]: value })); queueSave({ answers: { [key]: value } }); };
                      return (
                        <Card key={key} className="space-y-3 p-5">
                          <h3 className="flex justify-between gap-3 font-medium text-white"><span><span className="text-slate-500">Q{index + 1}.</span> {question.prompt}</span><span className="shrink-0 font-mono text-xs text-slate-400">{question.points} pts</span></h3>
                          {question.options ? (
                            <fieldset className="space-y-2">
                              <legend className="sr-only">{question.prompt}</legend>
                              {question.options.map((option) => (
                                <label key={option} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-600">
                                  <input type="radio" name={inputId} value={option} checked={answers[key] === option} onChange={() => set(option)} className="mt-1 accent-sky-400" />
                                  {option}
                                </label>
                              ))}
                            </fieldset>
                          ) : (
                            <>
                              <label htmlFor={inputId} className="text-xs text-slate-400">Answer format: {question.format}</label>
                              <Input id={inputId} value={answers[key] ?? ""} onChange={(event) => set(event.target.value)} onBlur={() => void flush()} autoComplete="off" spellCheck={false} maxLength={500} className="font-mono" />
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Card className="space-y-3 p-5">
                  <label htmlFor="exam-report" className="text-lg font-semibold text-white">Incident report</label>
                  <p className="text-sm text-slate-300">{exam.report.prompt}</p>
                  <textarea id="exam-report" value={report} onChange={(event) => { setReport(event.target.value); queueSave({ report: event.target.value }); }} onBlur={() => void flush()} maxLength={exam.report.maxLength} className="min-h-[420px] w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400" />
                  <p className="text-xs text-slate-500">{report.trim().length < exam.report.minLength ? `At least ${exam.report.minLength} characters (${report.trim().length} so far)` : `${report.trim().length} / ${exam.report.maxLength}`}</p>
                </Card>
                <Card className="h-fit space-y-3 p-5">
                  <h2 className="text-lg font-semibold text-white">Rubric</h2>
                  {exam.report.rubric.map((criterion) => (
                    <div key={criterion.id} className="text-sm"><p className="flex justify-between font-medium text-slate-100"><span>{criterion.label}</span><Badge>{criterion.points} pts</Badge></p><p className="text-slate-400">{criterion.description}</p></div>
                  ))}
                </Card>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" disabled={submitting} onClick={() => void submit(false)} className="bg-sky-400 text-slate-950">{submitting ? "Submitting..." : "Submit exam"}</Button>
              <span className="text-sm text-slate-400">Answers save automatically. Submitting ends the attempt.</span>
            </div>
            {submitError ? <ErrorMessage>{submitError}</ErrorMessage> : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
