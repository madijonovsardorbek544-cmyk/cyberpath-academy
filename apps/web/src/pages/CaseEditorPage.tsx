import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button, Card, ErrorMessage, FormField, Input, Loader, SectionTitle, Select, Textarea } from "../components/ui";
import type { CaseDraft, CommunitySubmission } from "../types";

type EvidenceForm = { name: string; kind: CaseDraft["evidence"][number]["kind"]; description: string; content: string };
type QuestionForm = { prompt: string; format: string; hint: string; choice: boolean; options: string; answers: string; explanation: string; points: number };
type Form = Omit<CaseDraft, "skills" | "evidence" | "questions"> & { skills: string; evidence: EvidenceForm[]; questions: QuestionForm[] };

const emptyQuestion = (): QuestionForm => ({ prompt: "", format: "", hint: "", choice: false, options: "", answers: "", explanation: "", points: 10 });
const emptyForm = (): Form => ({
  title: "", summary: "", story: "", category: "Authentication", difficulty: "beginner", estimatedMinutes: 15, skills: "",
  evidence: [{ name: "", kind: "log", description: "", content: "" }],
  questions: [emptyQuestion(), emptyQuestion(), emptyQuestion()],
  debrief: ""
});

const splitLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

function toDraft(form: Form): CaseDraft {
  return {
    ...form,
    skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
    evidence: form.evidence.map((item, index) => ({ ...item, id: `e${index + 1}` })),
    questions: form.questions.map((question, index) => ({
      id: `q${index + 1}`,
      prompt: question.prompt,
      format: question.choice ? "Pick one" : question.format,
      hint: question.hint,
      ...(question.choice ? { options: splitLines(question.options) } : {}),
      answers: splitLines(question.answers),
      explanation: question.explanation,
      points: question.points
    })),
    debrief: form.debrief
  };
}

function fromDraft(draft: CaseDraft): Form {
  return {
    ...draft,
    skills: draft.skills.join(", "),
    evidence: draft.evidence.map(({ id: _id, ...item }) => item),
    questions: draft.questions.map((question) => ({ prompt: question.prompt, format: question.format, hint: question.hint, choice: Boolean(question.options), options: (question.options ?? []).join("\n"), answers: question.answers.join("\n"), explanation: question.explanation, points: question.points })),
    debrief: draft.debrief
  };
}

export function CaseEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(id ? null : emptyForm());
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ submissions: CommunitySubmission[] }>("/community-cases/mine").then(({ submissions }) => {
      const found = submissions.find((item) => item.id === id);
      if (!found) return setError("Submission not found.");
      setForm(fromDraft(found.case));
      setReviewNote(found.reviewNote);
    }).catch((err: Error) => setError(err.message));
  }, [id]);

  if (!form) return <AppShell>{error ? <ErrorMessage>{error}</ErrorMessage> : <Loader text="Loading your case..." />}</AppShell>;

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const setEvidence = (index: number, patch: Partial<EvidenceForm>) => set({ evidence: form.evidence.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  const setQuestion = (index: number, patch: Partial<QuestionForm>) => set({ questions: form.questions.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const save = async (submit: boolean) => {
    setBusy(true);
    setError("");
    try {
      const body = { case: toDraft(form), submit };
      if (id) await api.patch(`/community-cases/${id}`, body);
      else await api.post("/community-cases", body);
      navigate("/cases/mine");
    } catch (err) {
      setError((err as Error).message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/cases/mine" className="text-sm text-sky-300 hover:text-sky-200">← My cases</Link>
        <SectionTitle eyebrow="Write a case" title={id ? "Edit your case" : "Create an investigation for other learners"} subtitle="Use invented people and companies. IP addresses must come from 192.0.2.x, 198.51.100.x, 203.0.113.x or private ranges, and domains must end in .example or .test. A mentor reviews every case before it goes live." />
        {reviewNote ? <Card className="border-amber-300/40 p-4 text-sm text-amber-100"><strong>Reviewer note:</strong> {reviewNote}</Card> : null}
        {error ? <Card className="border-rose-400/40 p-4"><ErrorMessage>{error}</ErrorMessage></Card> : null}

        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <FormField id="case-title" label="Title"><Input id="case-title" value={form.title} maxLength={80} onChange={(event) => set({ title: event.target.value })} /></FormField>
          <FormField id="case-skills" label="Skills" hint="Comma separated, e.g. Log reading, MFA"><Input id="case-skills" value={form.skills} onChange={(event) => set({ skills: event.target.value })} /></FormField>
          <div className="md:col-span-2"><FormField id="case-summary" label="One-line summary"><Input id="case-summary" value={form.summary} maxLength={240} onChange={(event) => set({ summary: event.target.value })} /></FormField></div>
          <div className="md:col-span-2"><FormField id="case-story" label="Story" hint="What happened and what the learner has to work with."><Textarea id="case-story" value={form.story} maxLength={2000} onChange={(event) => set({ story: event.target.value })} /></FormField></div>
          <FormField id="case-category" label="Category"><Select id="case-category" value={form.category} onChange={(event) => set({ category: event.target.value as Form["category"] })}>{["Authentication", "Phishing", "Endpoint", "Network", "Cloud", "Web"].map((option) => <option key={option}>{option}</option>)}</Select></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="case-difficulty" label="Difficulty"><Select id="case-difficulty" value={form.difficulty} onChange={(event) => set({ difficulty: event.target.value as Form["difficulty"] })}>{["beginner", "intermediate", "advanced"].map((option) => <option key={option}>{option}</option>)}</Select></FormField>
            <FormField id="case-minutes" label="Minutes"><Input id="case-minutes" type="number" min={5} max={120} value={form.estimatedMinutes} onChange={(event) => set({ estimatedMinutes: Number(event.target.value) })} /></FormField>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Evidence files</h2>
          {form.evidence.map((item, index) => (
            <Card key={index} className="grid gap-4 p-5 md:grid-cols-3">
              <FormField id={`ev-name-${index}`} label="File name" hint="e.g. auth.log"><Input id={`ev-name-${index}`} value={item.name} onChange={(event) => setEvidence(index, { name: event.target.value })} className="font-mono" /></FormField>
              <FormField id={`ev-kind-${index}`} label="Type"><Select id={`ev-kind-${index}`} value={item.kind} onChange={(event) => setEvidence(index, { kind: event.target.value as EvidenceForm["kind"] })}>{["log", "email", "json", "csv", "text"].map((option) => <option key={option}>{option}</option>)}</Select></FormField>
              <FormField id={`ev-desc-${index}`} label="Description"><Input id={`ev-desc-${index}`} value={item.description} onChange={(event) => setEvidence(index, { description: event.target.value })} /></FormField>
              <div className="md:col-span-3"><FormField id={`ev-content-${index}`} label="Contents"><Textarea id={`ev-content-${index}`} value={item.content} onChange={(event) => setEvidence(index, { content: event.target.value })} className="min-h-[180px] font-mono text-xs" /></FormField></div>
              {form.evidence.length > 1 ? <Button type="button" onClick={() => set({ evidence: form.evidence.filter((_, i) => i !== index) })} className="w-fit border border-slate-700 text-slate-200"><span className="flex items-center gap-2"><Trash2 size={14} aria-hidden="true" /> Remove file</span></Button> : null}
            </Card>
          ))}
          {form.evidence.length < 5 ? <Button type="button" onClick={() => set({ evidence: [...form.evidence, { name: "", kind: "log", description: "", content: "" }] })} className="border border-slate-700 text-slate-100"><span className="flex items-center gap-2"><Plus size={14} aria-hidden="true" /> Add evidence file</span></Button> : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Questions <span className="text-sm font-normal text-slate-400">(3 to 10)</span></h2>
          {form.questions.map((question, index) => (
            <Card key={index} className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2"><FormField id={`q-prompt-${index}`} label={`Question ${index + 1}`}><Input id={`q-prompt-${index}`} value={question.prompt} onChange={(event) => setQuestion(index, { prompt: event.target.value })} /></FormField></div>
              <label className="flex items-center gap-2 text-sm text-slate-200 md:col-span-2">
                <input type="checkbox" checked={question.choice} onChange={(event) => setQuestion(index, { choice: event.target.checked })} className="h-4 w-4 accent-sky-400" /> Multiple choice
              </label>
              {question.choice ? (
                <>
                  <FormField id={`q-options-${index}`} label="Options" hint="One per line, 2 to 6."><Textarea id={`q-options-${index}`} value={question.options} onChange={(event) => setQuestion(index, { options: event.target.value })} /></FormField>
                  <FormField id={`q-correct-${index}`} label="Correct option">
                    <Select id={`q-correct-${index}`} value={question.answers} onChange={(event) => setQuestion(index, { answers: event.target.value })}>
                      <option value="">Choose the correct option</option>
                      {splitLines(question.options).map((option) => <option key={option} value={option}>{option}</option>)}
                    </Select>
                  </FormField>
                </>
              ) : (
                <>
                  <FormField id={`q-format-${index}`} label="Answer format" hint="e.g. IPv4 address, Username"><Input id={`q-format-${index}`} value={question.format} onChange={(event) => setQuestion(index, { format: event.target.value })} /></FormField>
                  <FormField id={`q-answers-${index}`} label="Accepted answers" hint="One per line. Case and spacing are ignored."><Textarea id={`q-answers-${index}`} value={question.answers} onChange={(event) => setQuestion(index, { answers: event.target.value })} className="min-h-[80px] font-mono" /></FormField>
                </>
              )}
              <FormField id={`q-hint-${index}`} label="Hint"><Input id={`q-hint-${index}`} value={question.hint} onChange={(event) => setQuestion(index, { hint: event.target.value })} /></FormField>
              <FormField id={`q-points-${index}`} label="Points (5-20)"><Input id={`q-points-${index}`} type="number" min={5} max={20} value={question.points} onChange={(event) => setQuestion(index, { points: Number(event.target.value) })} /></FormField>
              <div className="md:col-span-2"><FormField id={`q-expl-${index}`} label="Explanation shown after a correct answer"><Textarea id={`q-expl-${index}`} value={question.explanation} onChange={(event) => setQuestion(index, { explanation: event.target.value })} className="min-h-[80px]" /></FormField></div>
              {form.questions.length > 3 ? <Button type="button" onClick={() => set({ questions: form.questions.filter((_, i) => i !== index) })} className="w-fit border border-slate-700 text-slate-200"><span className="flex items-center gap-2"><Trash2 size={14} aria-hidden="true" /> Remove question</span></Button> : null}
            </Card>
          ))}
          {form.questions.length < 10 ? <Button type="button" onClick={() => set({ questions: [...form.questions, emptyQuestion()] })} className="border border-slate-700 text-slate-100"><span className="flex items-center gap-2"><Plus size={14} aria-hidden="true" /> Add question</span></Button> : null}
        </section>

        <Card className="p-5">
          <FormField id="case-debrief" label="Debrief" hint="Shown when the learner finishes: what happened and what a good response looks like."><Textarea id="case-debrief" value={form.debrief} onChange={(event) => set({ debrief: event.target.value })} /></FormField>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void save(false)} className="border border-slate-700 text-slate-100">Save draft</Button>
          <Button type="button" disabled={busy} onClick={() => void save(true)} className="bg-sky-400 text-slate-950">{busy ? "Saving..." : "Submit for review"}</Button>
        </div>
      </div>
    </AppShell>
  );
}
