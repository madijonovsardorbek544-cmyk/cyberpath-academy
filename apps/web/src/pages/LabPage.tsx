import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, Loader, SectionTitle, Textarea } from "../components/ui";
import type { Lab } from "../types";

export function LabPage() {
  const { slug } = useParams();
  const [lab, setLab] = useState<Lab | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get<{ lab: Lab }>(`/learning/labs/${slug}`).then((data) => setLab(data.lab));
  }, [slug]);

  if (!lab) return <AppShell><Loader text="Loading lab..." /></AppShell>;

  const submit = async () => {
    setLoading(true);
    try {
      const data = await api.post<{ submission: { score: number; feedback: string } }>(`/learning/labs/${lab.id}/submit`, { answers });
      setResult(data.submission);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle eyebrow={lab.category} title={lab.title} subtitle={lab.description} />
          <div className="flex gap-2"><Badge>{lab.difficulty}</Badge></div>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Fictional dataset</h3>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-300">{JSON.stringify(lab.dataset, null, 2)}</pre>
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{lab.safeGuardrails}</div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Your lab answers</h3>
            <div className="mt-4 space-y-4">
              {lab.tasks.map((task) => (
                <div key={task.id}>
                  <p className="mb-2 text-sm font-medium text-white">{task.prompt}</p>
                  <Textarea value={answers[task.id] || ""} onChange={(event) => setAnswers((prev) => ({ ...prev, [task.id]: event.target.value }))} placeholder="Explain your reasoning in defensive, evidence-based terms..." />
                </div>
              ))}
            </div>
            <Button className="mt-5 bg-sky-400 text-slate-950" onClick={submit} disabled={loading}>{loading ? 'Scoring...' : 'Submit lab'}</Button>
            {result ? <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-lg font-semibold text-white">Score: {result.score}%</p><p className="mt-2 text-sm text-slate-300">{result.feedback}</p><p className="mt-3 text-xs text-slate-500">Solution outline: {lab.solutionOutline}</p></div> : null}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
