import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, ErrorMessage, Loader, SectionTitle, Textarea } from "../components/ui";
import type { CommunitySubmission } from "../types";

function ReviewCard({ item, onDone }: { item: CommunitySubmission; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const decide = async (decision: "publish" | "changes_requested" | "rejected") => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/community-cases/${item.id}/review`, { decision, note: note.trim() || undefined });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const draft = item.case;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-white">{draft.title}</h2><Badge>{draft.category}</Badge><Badge>{draft.difficulty}</Badge></div>
      <p className="text-sm text-slate-400">By {item.authorName} · {draft.summary}</p>
      <p className="text-sm text-slate-200">{draft.story}</p>
      {draft.evidence.map((evidence) => (
        <details key={evidence.id} className="rounded-2xl border border-slate-800 p-3">
          <summary className="cursor-pointer font-mono text-sm text-slate-100">{evidence.name} <span className="text-slate-500">({evidence.kind})</span></summary>
          <pre className="mt-2 max-h-72 overflow-auto font-mono text-xs text-slate-300">{evidence.content}</pre>
        </details>
      ))}
      <ol className="space-y-3">
        {draft.questions.map((question, index) => (
          <li key={question.id} className="rounded-2xl bg-slate-950/60 p-3 text-sm">
            <p className="font-medium text-white">Q{index + 1}. {question.prompt} <span className="text-slate-500">({question.points} pts)</span></p>
            {question.options ? <p className="text-slate-400">Options: {question.options.join(" · ")}</p> : null}
            <p className="text-emerald-300">Accepted: {question.answers.join(" · ")}</p>
            <p className="text-slate-400">Hint: {question.hint}</p>
            <p className="text-slate-300">{question.explanation}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-slate-300"><strong className="text-white">Debrief:</strong> {draft.debrief}</p>
      <p className="text-xs text-slate-500">Check that every answer can be found in the evidence, the content is defensive, and nothing names a real person or company.</p>
      <label htmlFor={`note-${item.id}`} className="text-sm font-medium text-white">Note to the author (required unless publishing)</label>
      <Textarea id={`note-${item.id}`} value={note} onChange={(event) => setNote(event.target.value)} className="min-h-[80px]" />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void decide("publish")} className="bg-emerald-400 text-slate-950">Publish</Button>
        <Button type="button" disabled={busy} onClick={() => void decide("changes_requested")} className="border border-amber-300/50 text-amber-100">Request changes</Button>
        <Button type="button" disabled={busy} onClick={() => void decide("rejected")} className="border border-rose-400/40 text-rose-100">Reject</Button>
      </div>
    </Card>
  );
}

export function CaseReviewPage() {
  const [submissions, setSubmissions] = useState<CommunitySubmission[] | null>(null);
  const [error, setError] = useState("");
  const load = () => api.get<{ submissions: CommunitySubmission[] }>("/community-cases/review").then((data) => setSubmissions(data.submissions)).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Mentor review" title="Community cases waiting for review" subtitle="Publish cases that are accurate, defensive and use only fictional data. Send others back with a clear note." />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {!submissions ? <Loader text="Loading the review queue..." /> : submissions.length === 0 ? <EmptyState title="Nothing to review" description="New submissions will appear here." /> : submissions.map((item) => <ReviewCard key={item.id} item={item} onDone={() => void load()} />)}
      </div>
    </AppShell>
  );
}
