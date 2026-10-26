import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, ErrorMessage, ErrorState, Loader, SectionTitle } from "../components/ui";
import type { ExamAttempt, ExamOverview } from "../types";

const statusLabel: Record<string, string> = { in_progress: "In progress", submitted: "Waiting for mentor grading", passed: "Passed", failed: "Not passed" };

export function ExamPage() {
  const [data, setData] = useState<ExamOverview | null>(null);
  const [error, setError] = useState("");
  const [startError, setStartError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = () => {
    setError("");
    api.get<ExamOverview>("/exams").then(setData).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  const start = async () => {
    if (!data?.activeAttemptId && !window.confirm(`The ${data?.exam.durationMinutes}-minute timer starts now and keeps running if you close the page. Start the exam?`)) return;
    setBusy(true);
    setStartError("");
    try {
      const { attempt } = await api.post<{ attempt: ExamAttempt }>(`/exams/${data!.exam.slug}/start`);
      navigate(`/exam/attempt/${attempt.id}`);
    } catch (err) {
      setStartError((err as Error).message);
      setBusy(false);
    }
  };

  if (error) return <AppShell><ErrorState title="Could not load the exam" description={error} onAction={load} /></AppShell>;
  if (!data) return <AppShell><Loader text="Loading the exam..." /></AppShell>;
  const { exam } = data;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Practical exam" title={exam.title} subtitle={exam.summary} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-white">How it works</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>{exam.durationMinutes} minutes, timed on the server. Your answers save as you type, and the exam submits itself when time runs out.</li>
              <li>{exam.sections.length} evidence sections ({exam.sections.reduce((sum, section) => sum + section.questionCount, 0)} questions, {exam.questionPoints} points). No hints, and you will not see which answers were right.</li>
              <li>A written incident report ({exam.reportPoints} points) that a mentor grades against the rubric.</li>
              <li>Pass with {exam.passMark} of 100 points and at least {exam.reportPassMark} on the report. You get a certificate code anyone can check.</li>
              <li>If you do not pass, you can try again {exam.retakeCooldownDays} days after grading.</li>
            </ul>
            <p className="text-sm text-slate-400">All companies, people and addresses are fictional. Use only the evidence provided.</p>
            {data.blockedReason ? <p className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200" role="status">{data.blockedReason}</p> : null}
            {startError ? <ErrorMessage>{startError}</ErrorMessage> : null}
            {data.activeAttemptId || data.canStart ? (
              <Button type="button" disabled={busy} onClick={() => void start()} className="bg-sky-400 text-slate-950">{data.activeAttemptId ? "Resume your attempt" : busy ? "Starting..." : "Start the exam"}</Button>
            ) : null}
            {user?.role === "mentor" || user?.role === "admin" ? <Link to="/exam/review" className="block text-sm text-sky-300 hover:text-sky-200">Grade submitted reports →</Link> : null}
          </Card>
          <Card className="h-fit space-y-3 p-6">
            <h2 className="text-lg font-semibold text-white">Report rubric</h2>
            <ul className="space-y-3">
              {exam.rubric.map((criterion) => (
                <li key={criterion.id} className="text-sm">
                  <p className="flex justify-between font-medium text-slate-100"><span>{criterion.label}</span><span className="font-mono text-xs text-slate-400">{criterion.points} pts</span></p>
                  <p className="text-slate-400">{criterion.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        {data.attempts.length ? (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white">Your attempts</h2>
            <ul className="mt-3 space-y-2">
              {data.attempts.map((attempt) => (
                <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 px-4 py-3 text-sm">
                  <span className="text-slate-300">{new Date(attempt.startedAt).toLocaleString()}</span>
                  <span className="flex flex-wrap items-center gap-3">
                    <Badge className={attempt.status === "passed" ? "border-emerald-400/40 text-emerald-200" : undefined}>{statusLabel[attempt.status]}</Badge>
                    {attempt.totalScore !== null ? <span className="font-mono text-xs text-slate-300">{attempt.totalScore} / 100</span> : null}
                    {attempt.certificateCode ? <Link to={`/verify/${attempt.certificateCode}`} className="text-sky-300 hover:text-sky-200">{attempt.certificateCode}</Link> : null}
                    <Link to={`/exam/attempt/${attempt.id}`} className="text-sky-300 hover:text-sky-200">{attempt.status === "in_progress" ? "Continue" : "View"}</Link>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
