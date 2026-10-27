import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { AppShell } from "../components/AppShell";
import { Badge, Card, ErrorState, Loader, SectionTitle } from "../components/ui";
import type { CaseListItem } from "../types";

export function CasesPage() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const load = () => {
    setError("");
    api.get<{ cases: CaseListItem[] }>("/cases").then((data) => setCases(data.cases)).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <AppShell><ErrorState title="Could not load cases" description={error} onAction={load} /></AppShell>;
  if (!cases) return <AppShell><Loader text="Loading investigations..." /></AppShell>;

  const solved = cases.filter((item) => item.progress.completed).length;
  const points = cases.reduce((sum, item) => sum + item.progress.pointsEarned, 0);

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Investigations"
          title="Work real-format evidence like an analyst."
          subtitle="Each case gives you logs, emails or cloud events from a fictional company. Search the evidence, answer the questions, and unlock the full debrief when you finish."
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{solved} of {cases.length} cases closed · {points} points earned</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link to="/cases/mine" className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-100 hover:border-sky-400/40">Write a case</Link>
            {user?.role === "mentor" || user?.role === "admin" ? <Link to="/cases/review" className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-100 hover:border-sky-400/40">Review queue</Link> : null}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((item) => {
            const percent = Math.round((item.progress.solvedQuestions / item.progress.totalQuestions) * 100);
            return (
              <Link key={item.slug} to={`/cases/${item.slug}`} className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                <Card className="flex h-full flex-col p-5 transition hover:border-sky-400/40">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.category}</Badge>
                    <Badge>{item.difficulty}</Badge>
                    {item.source === "community" ? <Badge className="border-violet-400/40 text-violet-200">Community · {item.author}</Badge> : null}
                    {item.progress.completed ? <Badge className="border-emerald-400/40 text-emerald-200">Closed</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-3 flex-1 text-sm text-slate-400">{item.summary}</p>
                  <p className="mt-4 text-xs text-slate-500">{item.evidenceCount} evidence {item.evidenceCount === 1 ? "file" : "files"} · {item.questionCount} questions · ~{item.estimatedMinutes} min</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} progress`}>
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${percent}%` }} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
