import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { AppShell } from "../components/AppShell";
import { Button, Card, Input, SectionTitle, Select } from "../components/ui";

const diagnosticQuestions = [
  { id: "q1", prompt: "Which security concept is about proving who a user is?", answer: "authentication", options: ["authorization", "authentication", "availability", "hashing"] },
  { id: "q2", prompt: "Which control most directly reduces risk from password theft?", answer: "mfa", options: ["mfa", "more tabs", "less logging", "longer URLs"] },
  { id: "q3", prompt: "What does DNS do?", answer: "maps names to ips", options: ["encrypts traffic", "maps names to ips", "stores passwords", "installs patches"] },
  { id: "q4", prompt: "Which principle says access should be as narrow as possible?", answer: "least privilege", options: ["defense in depth", "least privilege", "availability", "obfuscation"] },
  { id: "q5", prompt: "Which is the safest learning environment?", answer: "authorized sandbox", options: ["live target", "friend account", "authorized sandbox", "random public server"] }
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [goal, setGoal] = useState("SOC");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const score = useMemo(() => {
    const correct = diagnosticQuestions.filter((question) => answers[question.id] === question.answer).length;
    return Math.round((correct / diagnosticQuestions.length) * 100);
  }, [answers]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/learning/onboarding", { goal, experienceLevel, score });
      await refresh();
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Onboarding" title="Set your direction before you waste effort." subtitle="Choose your path, estimate your current level honestly, and take a short diagnostic so the app can generate a roadmap." />
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
          <Button className="bg-sky-400 text-slate-950" disabled={loading}>{loading ? "Generating roadmap..." : "Generate roadmap"}</Button>
        </form>
      </div>
    </AppShell>
  );
}
