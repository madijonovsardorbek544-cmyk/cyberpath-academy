import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, ErrorMessage, Input, Loader, SectionTitle } from "../components/ui";
import type { JobPost } from "../types";
import { jobKindLabel } from "./JobsPage";

function ReviewCard({ job, onDone }: { job: JobPost; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decide = async (decision: "approve" | "reject") => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/jobs/${job.id}/review`, { decision, note: note.trim() || undefined });
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <h2 className="text-lg font-semibold text-white">{job.title}</h2>
        <Badge>{jobKindLabel[job.kind] ?? job.kind}</Badge>
        {job.remote ? <Badge>Remote</Badge> : null}
      </div>
      <p className="text-sm text-slate-300">{job.company} · {job.location} · sent by {job.posterName} on {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}</p>
      <p className="whitespace-pre-line break-words rounded-2xl bg-slate-950/60 p-3 text-sm text-slate-200">{job.description}</p>
      <p className="break-all text-sm text-slate-400">Apply link: <span className="font-mono text-slate-200">{job.applyUrl}</span></p>
      <Input aria-label="Note to the poster (optional)" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Note to the poster (optional)" />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void decide("approve")} className="bg-emerald-400 text-slate-950">Approve for 60 days</Button>
        <Button type="button" disabled={busy} onClick={() => void decide("reject")} className="border border-rose-400/40 text-rose-100">Reject</Button>
      </div>
    </Card>
  );
}

export function JobReviewPage() {
  const [jobs, setJobs] = useState<JobPost[] | null>(null);
  const [error, setError] = useState("");
  const load = () => api.get<{ jobs: JobPost[] }>("/jobs/review").then((data) => setJobs(data.jobs)).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Mentor review" title="Job listings to check" subtitle="Approve real roles for defenders. Reject anything that asks applicants to pay, to test live systems they do not own, or that links somewhere suspicious." />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {!jobs ? <Loader text="Loading listings..." /> : jobs.length === 0 ? <EmptyState title="Nothing to review" description="New job listings will appear here." /> : jobs.map((job) => <ReviewCard key={job.id} job={job} onDone={() => void load()} />)}
      </div>
    </AppShell>
  );
}
