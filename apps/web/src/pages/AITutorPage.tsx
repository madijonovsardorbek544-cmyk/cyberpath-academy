import { FormEvent, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, SectionTitle, Textarea } from "../components/ui";

type TutorMode = "simple" | "deep";

type TutorSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type TutorResult = {
  answer: string;
  sections?: TutorSection[];
  recommendations: string[];
  safetyLevel?: "safe" | "redirected";
  generatedAt?: string;
  coachNote?: string;
};

const examplePrompts = [
  "Explain defense in depth simply and tell me what I should review next.",
  "How should I triage suspicious login logs?",
  "Explain phishing triage in beginner-friendly words.",
  "What is least privilege and why does it matter?",
  "Explain MFA deeply with a defensive example."
];

export function AITutorPage() {
  const [mode, setMode] = useState<TutorMode>("simple");
  const [prompt, setPrompt] = useState(
    "Explain defense in depth simply and tell me what I should review next."
  );
  const [result, setResult] = useState<TutorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const data = await api.post<TutorResult>("/ai/tutor", { prompt, mode });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Defensive learning coach"
          title="Ask for an explanation, review, or next-step push."
          subtitle="This coach explains cybersecurity defensively, adapts depth, and redirects unsafe requests toward authorized learning."
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <Card className="p-6">
            <div className="mb-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-2xl px-4 py-2 text-sm ${
                  mode === "simple"
                    ? "bg-sky-400 text-slate-950"
                    : "bg-slate-900 text-slate-300"
                }`}
                onClick={() => setMode("simple")}
              >
                Explain simply
              </button>

              <button
                type="button"
                className={`rounded-2xl px-4 py-2 text-sm ${
                  mode === "deep"
                    ? "bg-sky-400 text-slate-950"
                    : "bg-slate-900 text-slate-300"
                }`}
                onClick={() => setMode("deep")}
              >
                Explain deeply
              </button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask a defensive cybersecurity question..."
              />

              <Button
                className="bg-sky-400 text-slate-950"
                disabled={loading || !prompt.trim()}
              >
                {loading ? "Thinking..." : "Ask coach"}
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-sm font-semibold text-white">
                Strong example prompts
              </p>

              <div className="mt-3 space-y-2">
                {examplePrompts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt(item)}
                    className="block w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-sky-400/40 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Coach behavior
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  The response should be structured, safe, and action-oriented.
                </p>
              </div>

              <Badge className="border-emerald-400/30 text-emerald-200">
                Defensive only
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Defines the concept clearly",
                "Gives a defensive example",
                "Explains why it matters",
                "Assigns a practice task",
                "Suggests a next step",
                "Redirects unsafe intent"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm text-sky-100">
              This is not a live hacking assistant. It is a defensive learning
              coach for concepts, safe labs, evidence-based triage, and review
              planning.
            </div>
          </Card>
        </div>

        {result ? (
          <div className="space-y-5">
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                    Coach response
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {result.safetyLevel === "redirected"
                      ? "Safe redirect"
                      : "Structured explanation"}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      result.safetyLevel === "redirected"
                        ? "border-yellow-400/30 text-yellow-200"
                        : "border-emerald-400/30 text-emerald-200"
                    }
                  >
                    {result.safetyLevel === "redirected"
                      ? "Redirected safely"
                      : "Safe"}
                  </Badge>

                  <Badge>{mode === "simple" ? "Simple mode" : "Deep mode"}</Badge>
                </div>
              </div>

              {result.coachNote ? (
                <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                  {result.coachNote}
                </p>
              ) : null}
            </Card>

            {result.sections?.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {result.sections.map((section) => (
                  <Card key={section.title} className="p-5">
                    <h4 className="text-base font-semibold text-white">
                      {section.title}
                    </h4>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {section.body}
                    </p>

                    {section.bullets?.length ? (
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {result.answer}
                </p>
              </Card>
            )}

            {result.recommendations.length ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white">
                  Recommended next reviews
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {result.recommendations.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
