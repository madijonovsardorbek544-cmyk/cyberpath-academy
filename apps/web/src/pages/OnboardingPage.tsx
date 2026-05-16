import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isMockApiMode } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { AppShell } from "../components/AppShell";
import { Button, Card, SectionTitle, Select } from "../components/ui";

const diagnosticQuestions = [
  { id: "q1", prompt: "Which security concept is about proving who a user is?", answer: "authentication", options: ["authorization", "authentication", "availability", "hashing"] },
  { id: "q2", prompt: "Which control most directly reduces risk from password theft?", answer: "mfa", options: ["mfa", "more tabs", "less logging", "longer URLs"] },
  { id: "q3", prompt: "What does DNS do?", answer: "maps names to ips", options: ["encrypts traffic", "maps names to ips", "stores passwords", "installs patches"] },
  { id: "q4", prompt: "Which principle says access should be as narrow as possible?", answer: "least privilege", options: ["defense in depth", "least privilege", "availability", "obfuscation"] },
  { id: "q5", prompt: "Which is the safest learning environment?", answer: "authorized sandbox", options: ["live target", "friend account", "authorized sandbox", "random public server"] }
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [goal, setGoal] = useState(user?.goal || "awareness");
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || "beginner");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => {
    const correct = diagnosticQuestions.filter((question) => answers[question.id] === question.answer).length;
    return Math.round((correct / diagnosticQuestions.length) * 100);
  }, [answers]);

  const completeOnboarding = async (scoreOverride = score) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post<{ user?: unknown; roadmap?: unknown }>("/learning/onboarding", { goal: goal || "awareness", experienceLevel: experienceLevel || "beginner", score: scoreOverride });
      const refreshedUser = await refresh();
      if (!refreshedUser && !response.user) {
        throw new Error("Your roadmap was generated, but we could not restore your session. Please sign in again.");
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not generate your learning path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (answeredCount < diagnosticQuestions.length) {
      setError("Answer every diagnostic question so we can place you safely. You can also skip and start with beginner defaults.");
      return;
    }
    await completeOnboarding(score);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Onboarding" title="Set your direction before you waste effort." subtitle="Choose your path, estimate your current level honestly, and take a short diagnostic so the app can generate a roadmap." />
        {isMockApiMode ? (
          <Card className="border-sky-400/30 bg-sky-400/10 p-4 text-sm text-sky-100">
            This setup is simulated in the public demo. Your learning path is stored only in this browser and can be reset at any time.
          </Card>
        ) : null}
        {error ? (
          <Card className="border-rose-400/30 bg-rose-400/10 p-5">
            <p className="font-semibold text-rose-100">We could not finish onboarding yet.</p>
            <p className="mt-2 text-sm text-rose-100/85">{error}</p>
          </Card>
        ) : null}
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Goals and experience</h3>
              <div className="mt-4 space-y-4">
                <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                  {['awareness', 'SOC', 'AppSec', 'cloud security', 'security engineering', 'GRC'].map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  {['beginner', 'intermediate', 'advanced'].map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Card className="p-4">
                  <p className="text-sm text-slate-300">Current diagnostic score preview</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{score}%</p>
                  <p className="mt-1 text-xs text-slate-500">{answeredCount}/{diagnosticQuestions.length} answered</p>
                </Card>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white">Short diagnostic</h3>
              <div className="mt-4 space-y-4">
                {diagnosticQuestions.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm font-medium text-white">{question.prompt}</p>
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option) => (
                        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
                          <input type="radio" checked={answers[question.id] === option} onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-sky-400 text-slate-950" disabled={loading}>{loading ? "Generating learning path..." : "Generate my learning path"}</Button>
            <Button type="button" className="border border-slate-700 bg-slate-900 text-white" disabled={loading} onClick={() => completeOnboarding(0)}>Skip for now</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
