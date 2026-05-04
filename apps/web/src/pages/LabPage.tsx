import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { LabTerminal } from "../components/labs/LabTerminal";
import { Badge, Button, Card, Loader, SectionTitle, Textarea } from "../components/ui";
import type { Lab } from "../types";

type SubmissionResult = {
  score: number;
  feedback: string;
};

type LabMode = "terminal" | "written";

export function LabPage() {
  const { slug } = useParams();
  const [lab, setLab] = useState<Lab | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LabMode>("terminal");

  useEffect(() => {
    if (!slug) return;

    api
      .get<{ lab: Lab }>(`/learning/labs/${slug}`)
      .then((data) => setLab(data.lab));
  }, [slug]);

  if (!lab) {
    return (
      <AppShell>
        <Loader text="Loading lab..." />
      </AppShell>
    );
  }

  const submitWritten = async () => {
    setLoading(true);

    try {
      const data = await api.post<{ submission: SubmissionResult }>(
        `/learning/labs/${lab.id}/submit`,
        { answers }
      );

      setResult(data.submission);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            eyebrow={lab.category}
            title={lab.title}
            subtitle={lab.description}
          />

          <div className="flex flex-wrap gap-2">
            <Badge>{lab.difficulty}</Badge>
            <Badge className="border-emerald-400/30 text-emerald-200">
              Defensive simulation
            </Badge>
          </div>
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Lab mode</h3>
              <p className="mt-1 text-sm text-slate-400">
                Use terminal mode for an interactive simulation, or written mode for structured analysis.
              </p>
            </div>

            <div className="flex rounded-2xl border border-slate-800 bg-slate-950/70 p-1">
              <Button
                type="button"
                onClick={() => setMode("terminal")}
                className={
                  mode === "terminal"
                    ? "bg-sky-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }
              >
                Terminal mode
              </Button>

              <Button
                type="button"
                onClick={() => setMode("written")}
                className={
                  mode === "written"
                    ? "bg-sky-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }
              >
                Written mode
              </Button>
            </div>
          </div>
        </Card>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {lab.safeGuardrails}
        </div>

        {mode === "terminal" ? (
          <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
            <LabTerminal lab={lab} onSubmission={setResult} />

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">How to use the terminal</h3>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>
                  Start with <code className="rounded bg-slate-950 px-2 py-1 text-sky-200">help</code>.
                </p>
                <p>
                  Read files with <code className="rounded bg-slate-950 px-2 py-1 text-sky-200">ls</code> and{" "}
                  <code className="rounded bg-slate-950 px-2 py-1 text-sky-200">cat README.md</code>.
                </p>
                <p>
                  Save answers with{" "}
                  <code className="rounded bg-slate-950 px-2 py-1 text-sky-200">
                    answer task1 "your answer"
                  </code>.
                </p>
                <p>
                  Submit with <code className="rounded bg-slate-950 px-2 py-1 text-sky-200">submit</code>.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <h4 className="font-semibold text-white">Fictional dataset preview</h4>
                <pre className="mt-3 max-h-[260px] overflow-auto text-xs text-slate-300">
                  {JSON.stringify(lab.dataset, null, 2)}
                </pre>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Fictional dataset</h3>
              <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-300">
                {JSON.stringify(lab.dataset, null, 2)}
              </pre>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Your lab answers</h3>

              <div className="mt-4 space-y-4">
                {lab.tasks.map((task) => (
                  <div key={task.id}>
                    <p className="mb-2 text-sm font-medium text-white">
                      {task.prompt}
                    </p>

                    <Textarea
                      value={answers[task.id] || ""}
                      onChange={(event) =>
                        setAnswers((previous) => ({
                          ...previous,
                          [task.id]: event.target.value
                        }))
                      }
                      placeholder="Explain your reasoning in defensive, evidence-based terms..."
                    />
                  </div>
                ))}
              </div>

              <Button
                className="mt-5 bg-sky-400 text-slate-950"
                onClick={submitWritten}
                disabled={loading}
              >
                {loading ? "Scoring..." : "Submit lab"}
              </Button>
            </Card>
          </div>
        )}

        {result ? (
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                  Submission result
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {result.score}%
                </p>
              </div>

              <Badge className="border-sky-400/30 text-sky-200">
                Reviewed
              </Badge>
            </div>

            <p className="mt-4 text-sm text-slate-300">{result.feedback}</p>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Solution outline</p>
              <p className="mt-2 text-sm text-slate-300">{lab.solutionOutline}</p>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
