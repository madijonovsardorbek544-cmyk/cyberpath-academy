import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card, EmptyState, ErrorState, Input, Loader, SectionTitle, Select } from "../components/ui";
import type { JobPost } from "../types";

export const jobKindLabel: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", internship: "Internship", apprenticeship: "Apprenticeship", volunteer: "Volunteer" };

export function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const load = () => {
    setError("");
    api.get<{ jobs: JobPost[] }>("/jobs").then((data) => setJobs(data.jobs)).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (jobs ?? []).filter((job) => (!kind || job.kind === kind) && (!remoteOnly || job.remote) && (!needle || `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase().includes(needle)));
  }, [jobs, query, kind, remoteOnly]);

  if (error) return <AppShell><ErrorState title="Could not load jobs" description={error} onAction={load} /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Careers" title="Cyber security jobs" subtitle="Entry-level roles, internships and apprenticeships, checked by a mentor before they appear. Free to post and free to apply." />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/jobs/post" className="rounded-2xl bg-sky-400 px-4 py-3 font-medium text-slate-950 hover:bg-sky-300">Post a job</Link>
          <Link to="/talent" className="rounded-2xl border border-slate-700 px-4 py-3 text-slate-100 hover:border-sky-400/40">Browse learners open to work</Link>
          {user?.role === "mentor" || user?.role === "admin" ? <Link to="/jobs/review" className="rounded-2xl border border-slate-700 px-4 py-3 text-slate-100 hover:border-sky-400/40">Review listings</Link> : null}
        </div>
        <Card className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <Input aria-label="Search jobs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, company or city" />
          <Select aria-label="Job type" value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">All types</option>
            {Object.entries(jobKindLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} className="h-4 w-4" /> Remote only</label>
        </Card>
        {!jobs ? <Loader text="Loading jobs..." /> : shown.length === 0 ? (
          <EmptyState title={jobs.length ? "No jobs match your filters" : "No open jobs yet"} description={jobs.length ? "Try a different search or job type." : "Know a team that is hiring juniors? Post the role for free."} />
        ) : (
          <ul className="space-y-4">
            {shown.map((job) => (
              <li key={job.id}>
                <Card className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                      <p className="text-sm text-slate-300">{job.company} · {job.location}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{jobKindLabel[job.kind] ?? job.kind}</Badge>
                      {job.remote ? <Badge className="border-emerald-400/40 text-emerald-200">Remote</Badge> : null}
                    </div>
                  </div>
                  <p className="whitespace-pre-line break-words text-sm text-slate-300">{job.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>Posted {job.approvedAt ? new Date(job.approvedAt).toLocaleDateString() : ""}{job.expiresAt ? ` · open until ${new Date(job.expiresAt).toLocaleDateString()}` : ""}</span>
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="rounded-2xl border border-sky-400/40 px-4 py-2 text-sm text-sky-100 hover:bg-sky-400/10">Apply<span className="sr-only"> for {job.title} at {job.company}</span></a>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">CyberPath does not run these hiring processes. Never pay to apply for a job, and never share passwords or bank details with a recruiter.</p>
      </div>
    </AppShell>
  );
}
