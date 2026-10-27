import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, ErrorMessage, FormField, Input, SectionTitle, Select, Textarea } from "../components/ui";
import type { JobPost } from "../types";
import { jobKindLabel } from "./JobsPage";

const blank = { title: "", company: "", location: "", remote: false, kind: "full_time", description: "", applyUrl: "" };
const statusLabel: Record<string, string> = { pending: "Waiting for review", approved: "Live", rejected: "Not approved", closed: "Closed" };

export function JobPostPage() {
  const [form, setForm] = useState(blank);
  const [mine, setMine] = useState<JobPost[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof blank>) => setForm((current) => ({ ...current, ...patch }));

  const load = () => api.get<{ jobs: JobPost[] }>("/jobs/mine").then((data) => setMine(data.jobs)).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await api.post("/jobs", { ...form, applyUrl: form.applyUrl.trim() });
      setForm(blank);
      setStatus("Thanks! A mentor will review your listing, usually within a few days.");
      void load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const close = async (job: JobPost) => {
    if (!window.confirm(`Close "${job.title}"? It will stop showing on the jobs board.`)) return;
    try {
      await api.post(`/jobs/${job.id}/close`);
      void load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/jobs" className="text-sm text-sky-300 hover:text-sky-200">← Jobs board</Link>
        <SectionTitle eyebrow="Careers" title="Post a job for free" subtitle="Listings are checked by a mentor, then stay up for 60 days. We only accept real roles for defenders: no unpaid 'tests' on live systems and no fees for applicants." />
        <Card className="p-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <FormField id="job-title" label="Job title"><Input id="job-title" value={form.title} onChange={(event) => set({ title: event.target.value })} maxLength={120} placeholder="Junior SOC Analyst" required /></FormField>
            <FormField id="job-company" label="Company or school"><Input id="job-company" value={form.company} onChange={(event) => set({ company: event.target.value })} maxLength={120} required /></FormField>
            <FormField id="job-location" label="Location"><Input id="job-location" value={form.location} onChange={(event) => set({ location: event.target.value })} maxLength={120} placeholder="Tashkent" required /></FormField>
            <FormField id="job-kind" label="Type">
              <Select id="job-kind" value={form.kind} onChange={(event) => set({ kind: event.target.value })}>
                {Object.entries(jobKindLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm text-slate-200 md:col-span-2"><input type="checkbox" checked={form.remote} onChange={(event) => set({ remote: event.target.checked })} className="h-4 w-4" /> Remote work is possible</label>
            <div className="md:col-span-2">
              <FormField id="job-description" label="Description" hint="30 to 4000 characters. What the person will do, what they need to know, and what you offer.">
                <Textarea id="job-description" value={form.description} onChange={(event) => set({ description: event.target.value })} rows={8} maxLength={4000} required />
              </FormField>
            </div>
            <div className="md:col-span-2">
              <FormField id="job-apply" label="How to apply" hint="An https:// link or a mailto: address.">
                <Input id="job-apply" value={form.applyUrl} onChange={(event) => set({ applyUrl: event.target.value })} maxLength={500} placeholder="https://careers.example.com/soc-analyst" required />
              </FormField>
            </div>
            {error ? <div className="md:col-span-2"><ErrorMessage>{error}</ErrorMessage></div> : null}
            {status ? <p role="status" className="text-sm text-emerald-300 md:col-span-2">{status}</p> : null}
            <div className="md:col-span-2"><Button type="submit" disabled={busy} className="bg-sky-400 text-slate-950">{busy ? "Sending..." : "Send for review"}</Button></div>
          </form>
        </Card>
        {mine.length ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Your listings</h2>
            <ul className="space-y-2">
              {mine.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-200">
                  <span className="space-y-1">
                    <span className="block">{job.title} <span className="text-slate-500">· {job.company}</span></span>
                    {job.reviewNote ? <span className="block text-xs text-slate-400">Reviewer: {job.reviewNote}</span> : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge>{statusLabel[job.status ?? ""] ?? job.status}</Badge>
                    {job.status === "pending" || job.status === "approved" ? <button type="button" onClick={() => void close(job)} className="text-xs text-slate-400 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Close</button> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
