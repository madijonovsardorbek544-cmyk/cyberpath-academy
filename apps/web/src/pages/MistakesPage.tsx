import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, Loader, SectionTitle, Textarea } from "../components/ui";
import type { Mistake, Recommendation } from "../types";

type ReviewItem = {
  id: string;
  topic: string;
  prompt: string;
  explanation: string;
  correctAnswer: unknown;
  recoveryAction: string;
};

export function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[] | null>(null);
  const [reviewQuiz, setReviewQuiz] = useState<ReviewItem[] | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  const load = () => api.get<{ mistakes: Mistake[] }>("/learning/mistakes").then((data) => setMistakes(data.mistakes));

  useEffect(() => {
    load();
  }, []);

  if (!mistakes) return <AppShell><Loader text="Loading mistakes..." /></AppShell>;

  const generateReview = async () => {
    const response = await api.get<{ quiz: ReviewItem[]; recommendations: Recommendation[] }>("/learning/mistakes/review-quiz");
    setReviewQuiz(response.quiz);
    setRecommendations(response.recommendations);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle eyebrow="Mistake notebook" title="Track the errors you repeat so they stop repeating." subtitle="The app saves wrong quiz answers here. Add notes. Review patterns. Generate targeted recovery instead of pretending random practice is enough." />
          <Button className="bg-sky-400 text-slate-950" onClick={generateReview}>Generate review quiz</Button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr,0.8fr]">
          <div className="space-y-4">
            {mistakes.map((mistake) => (
              <Card key={mistake.id} className="p-5">
                <div className="flex flex-wrap gap-2"><Badge>{mistake.topic}</Badge><Badge>{mistake.subtopic}</Badge><Badge>{mistake.repeatCount} repeats</Badge></div>
                <h3 className="mt-4 text-lg font-semibold text-white">{mistake.prompt}</h3>
                <p className="mt-2 text-sm text-slate-400">{mistake.explanation}</p>
                <Textarea className="mt-4" value={mistake.notes || ""} onChange={(event) => setMistakes((prev) => prev?.map((item) => item.id === mistake.id ? { ...item, notes: event.target.value } : item) || null)} />
                <Button className="mt-3 bg-slate-200 text-slate-950" onClick={async () => { await api.patch(`/learning/mistakes/${mistake.id}`, { notes: mistake.notes || "" }); load(); }}>Save note</Button>
              </Card>
            ))}
          </div>
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-white">Generated review set</h3>
              <div className="mt-4 space-y-3">
                {reviewQuiz?.length ? reviewQuiz.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><p className="font-medium text-white">{item.prompt}</p><p className="mt-2 text-sm text-slate-400">Explanation: {item.explanation}</p><p className="mt-2 text-xs text-slate-500">Correct answer: {JSON.stringify(item.correctAnswer)}</p><p className="mt-2 text-xs text-amber-200">Recovery action: {item.recoveryAction}</p></div>) : <p className="text-sm text-slate-400">Generate a review quiz from your highest-frequency mistakes.</p>}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-white">Adaptive remediation plan</h3>
              <div className="mt-4 space-y-3">
                {recommendations?.length ? recommendations.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.title}</p><Badge>{item.priority}</Badge></div><p className="mt-2 text-sm text-slate-400">{item.reason}</p><p className="mt-2 text-xs text-slate-500">Action: {item.actionType} → {item.actionTarget}</p></div>) : <p className="text-sm text-slate-400">No remediation plan generated yet.</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
