import { useMemo, useState } from "react";
import type { QuizQuestion, QuizResult } from "../types";
import { Button, Card, Input, Textarea } from "./ui";

function normalizeValue(type: QuizQuestion["type"], value: any) {
  if (type === "multi-select") return Array.isArray(value) ? [...value].sort() : [];
  return value;
}

export function QuizRenderer({
  questions,
  onSubmit
}: {
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, any>, durationMinutes: number) => Promise<QuizResult>;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(Date.now());

  const totalAnswered = useMemo(() => Object.keys(answers).length, [answers]);

  const updateMultiSelect = (questionId: string, optionId: string, checked: boolean) => {
    const current = new Set((answers[questionId] as string[]) || []);
    if (checked) current.add(optionId);
    else current.delete(optionId);
    setAnswers((prev) => ({ ...prev, [questionId]: [...current].sort() }));
  };

  const updateMatching = (questionId: string, left: string, right: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [left]: right
      }
    }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      const normalized = Object.fromEntries(questions.map((question) => [question.id, normalizeValue(question.type, answers[question.id])]));
      const response = await onSubmit(normalized, durationMinutes);
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{questions.length} questions</span>
        <span>{totalAnswered} answered</span>
      </div>

      {questions.map((question, index) => (
        <Card key={question.id} className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Q{index + 1}</span>
            <span>•</span>
            <span>{question.type}</span>
            <span>•</span>
            <span>{question.difficulty}</span>
            <span>•</span>
            <span>{question.subtopic}</span>
          </div>
          {question.scenarioContext ? <p className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">{question.scenarioContext}</p> : null}
          <h4 className="text-lg font-semibold text-white">{question.prompt}</h4>

          <div className="mt-4 space-y-3">
            {(question.type === "multiple-choice" || question.type === "scenario") && question.options?.map((option: any) => (
              <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <input type="radio" checked={answers[question.id] === option.id} onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))} />
                <span className="text-sm text-slate-200">{option.label}</span>
              </label>
            ))}

            {question.type === "multi-select" && question.options?.map((option: any) => (
              <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <input type="checkbox" checked={((answers[question.id] as string[]) || []).includes(option.id)} onChange={(event) => updateMultiSelect(question.id, option.id, event.target.checked)} />
                <span className="text-sm text-slate-200">{option.label}</span>
              </label>
            ))}

            {question.type === "true-false" && [true, false].map((choice) => (
              <label key={String(choice)} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <input type="radio" checked={answers[question.id] === choice} onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: choice }))} />
                <span className="text-sm text-slate-200">{choice ? "True" : "False"}</span>
              </label>
            ))}

            {question.type === "short-response" ? (
              <Textarea value={answers[question.id] || ""} onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))} placeholder="Type your answer..." />
            ) : null}

            {question.type === "matching" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {question.options.left.map((leftItem: string) => (
                  <div key={leftItem} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                    <p className="mb-2 text-sm font-medium text-white">{leftItem}</p>
                    <select className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100" value={(answers[question.id] || {})[leftItem] || ""} onChange={(event) => updateMatching(question.id, leftItem, event.target.value)}>
                      <option value="">Choose match</option>
                      {question.options.right.map((rightItem: string) => <option key={rightItem} value={rightItem}>{rightItem}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      ))}

      <Button className="w-full bg-sky-400 text-slate-950 sm:w-auto" onClick={submit} disabled={loading}>
        {loading ? "Scoring quiz..." : "Submit quiz"}
      </Button>

      {result ? (
        <Card className="p-5">
          <h3 className="text-xl font-semibold text-white">Quiz result: {result.score}%</h3>
          <p className="mt-2 text-sm text-slate-300">{result.correct} out of {result.total} correct · {result.difficulty}</p>
          <div className="mt-5 space-y-4">
            {result.review.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-white">{item.prompt}</h4>
                  <span className={`rounded-full px-3 py-1 text-xs ${item.isCorrect ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>{item.isCorrect ? "Correct" : "Review"}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Explanation: {item.explanation}</p>
                {!item.isCorrect ? <p className="mt-2 text-xs text-slate-400">Correct answer: {JSON.stringify(item.correctAnswer)}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
