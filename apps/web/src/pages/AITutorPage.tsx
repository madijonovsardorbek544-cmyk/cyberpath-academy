import { FormEvent, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, SectionTitle, Textarea } from "../components/ui";

export function AITutorPage() {
  const [mode, setMode] = useState<"simple" | "deep">("simple");
  const [prompt, setPrompt] = useState("Explain defense in depth simply and tell me what I should review next.");
  const [result, setResult] = useState<{ answer: string; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{ answer: string; recommendations: string[] }>("/ai/tutor", { prompt, mode });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="AI tutor" title="Ask for explanation, review, or a next-step push." subtitle="The tutor stays serious, adapts depth, and refuses unsafe offensive requests. It is built to coach, not flatter." />
        <Card className="p-6">
          <div className="mb-4 flex gap-3">
            <button className={`rounded-2xl px-4 py-2 text-sm ${mode === 'simple' ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300'}`} onClick={() => setMode('simple')}>Explain simply</button>
            <button className={`rounded-2xl px-4 py-2 text-sm ${mode === 'deep' ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300'}`} onClick={() => setMode('deep')}>Explain deeply</button>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <Button className="bg-sky-400 text-slate-950" disabled={loading}>{loading ? 'Thinking...' : 'Ask tutor'}</Button>
          </form>
        </Card>
        {result ? <Card className="p-6"><h3 className="text-lg font-semibold text-white">Tutor response</h3><p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{result.answer}</p><div className="mt-5 flex flex-wrap gap-2">{result.recommendations.map((item) => <Badge key={item}>{item}</Badge>)}</div></Card> : null}
      </div>
    </AppShell>
  );
}
