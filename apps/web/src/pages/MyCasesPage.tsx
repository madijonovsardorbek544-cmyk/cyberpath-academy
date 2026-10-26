import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, ErrorMessage, Loader, SectionTitle } from "../components/ui";
import type { CommunitySubmission } from "../types";

const statusLabel: Record<CommunitySubmission["status"], string> = {
  draft: "Draft",
  submitted: "Waiting for review",
  changes_requested: "Changes requested",
  published: "Published",
  rejected: "Not accepted"
};

export function MyCasesPage() {
  const [submissions, setSubmissions] = useState<CommunitySubmission[] | null>(null);
  const [error, setError] = useState("");
  const load = () => api.get<{ submissions: CommunitySubmission[] }>("/community-cases/mine").then((data) => setSubmissions(data.submissions)).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);

  const remove = async (id: string) => {
    try {
      await api.delete(`/community-cases/${id}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/cases" className="text-sm text-sky-300 hover:text-sky-200">← All investigations</Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Community cases" title="Cases you wrote" subtitle="Write an investigation for other learners. Mentors review each one before it is published." />
          <Link to="/cases/new" className="rounded-2xl bg-sky-400 px-4 py-3 font-medium text-slate-950">Write a case</Link>
        </div>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {!submissions ? <Loader text="Loading your cases..." /> : submissions.length === 0 ? (
          <EmptyState title="No cases yet" description="Turn something you learned into a case: a log, an email or a cloud event, and 3 to 10 questions about it." />
        ) : (
          <div className="space-y-3">
            {submissions.map((item) => (
              <Card key={item.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{item.case.title}</h2><Badge>{statusLabel[item.status]}</Badge></div>
                  <p className="text-sm text-slate-400">{item.case.summary}</p>
                  {item.reviewNote ? <p className="text-sm text-amber-200">Reviewer: {item.reviewNote}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "published" ? <Link to={`/cases/${item.slug}`} className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-100">Open</Link> : null}
                  {item.status === "draft" || item.status === "changes_requested" ? <Link to={`/cases/edit/${item.id}`} className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-100">Edit</Link> : null}
                  {item.status !== "published" ? <Button type="button" onClick={() => void remove(item.id)} className="border border-rose-400/40 text-sm text-rose-100">Delete</Button> : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
