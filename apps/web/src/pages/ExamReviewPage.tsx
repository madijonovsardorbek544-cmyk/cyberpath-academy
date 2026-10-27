import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button, Card, EmptyState, ErrorMessage, Input, Loader, SectionTitle, Textarea } from "../components/ui";
import type { ExamReviewItem, ExamRubricCriterion } from "../types";

function GradeCard({ item, rubric, onDone }: { item: ExamReviewItem; rubric: ExamRubricCriterion[]; onDone: () => void }) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reportTotal = rubric.reduce((sum, criterion) => sum + Math.min(criterion.points, Math.max(0, Number(scores[criterion.id]) || 0)), 0);

  const grade = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!window.confirm(`Record ${reportTotal} report points for a total of ${item.autoScore + reportTotal} / 100? This cannot be changed.`)) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/exams/attempts/${item.id}/grade`, { scores: Object.fromEntries(rubric.map((criterion) => [criterion.id, Number(scores[criterion.id]) || 0])), note });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">{item.candidate}</h2>
        <span className="text-sm text-slate-400">Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""} · evidence score {item.autoScore} / {item.autoMax}</span>
      </div>
      <p className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-200">{item.report || "No report was written."}</p>
      <form onSubmit={grade} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {rubric.map((criterion) => (
            <label key={criterion.id} className="space-y-1 text-sm">
              <span className="flex justify-between font-medium text-slate-100"><span>{criterion.label}</span><span className="text-xs text-slate-400">0 to {criterion.points}</span></span>
              <span className="block text-xs text-slate-400">{criterion.description}</span>
              <Input type="number" min={0} max={criterion.points} step={1} required value={scores[criterion.id] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: event.target.value }))} />
            </label>
          ))}
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-100">Note to the candidate</span>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What was strong, and what to improve." maxLength={3000} />
        </label>
        <p className="text-sm text-slate-300">Report {reportTotal} / {rubric.reduce((sum, criterion) => sum + criterion.points, 0)} · total {item.autoScore + reportTotal} / 100</p>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        <Button type="submit" disabled={busy || note.trim().length < 10} className="bg-sky-400 text-slate-950">{busy ? "Saving..." : "Record grade"}</Button>
      </form>
    </Card>
  );
}

export function ExamReviewPage() {
  const [data, setData] = useState<{ rubric: ExamRubricCriterion[]; reportPrompt: string; attempts: ExamReviewItem[] } | null>(null);
  const [error, setError] = useState("");
  const load = () => api.get<{ rubric: ExamRubricCriterion[]; reportPrompt: string; attempts: ExamReviewItem[] }>("/exams/review").then(setData).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Mentor review" title="Grade exam reports" subtitle={data ? `Candidates were asked: ${data.reportPrompt}` : "Score each report against the rubric and leave a note."} />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {!data ? <Loader text="Loading submitted exams..." /> : data.attempts.length === 0 ? <EmptyState title="Nothing to grade" description="Submitted exams will appear here." /> : data.attempts.map((item) => <GradeCard key={item.id} item={item} rubric={data.rubric} onDone={() => void load()} />)}
      </div>
    </AppShell>
  );
}
