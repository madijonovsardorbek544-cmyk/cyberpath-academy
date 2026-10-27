import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, ErrorMessage, ErrorState, Input, Loader, SectionTitle } from "../components/ui";
import type { TeamSummary } from "../types";

export function TeamsPage() {
  const [data, setData] = useState<{ leading: TeamSummary[]; memberOf: TeamSummary[] } | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = () => {
    setError("");
    api.get<{ leading: TeamSummary[]; memberOf: TeamSummary[] }>("/teams").then(setData).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const { team } = await api.post<{ team: TeamSummary }>("/teams", { name, description: description || undefined });
      navigate(`/teams/${team.id}`);
    } catch (err) {
      setFormError((err as Error).message);
      setBusy(false);
    }
  };

  if (error) return <AppShell><ErrorState title="Could not load teams" description={error} onAction={load} /></AppShell>;
  if (!data) return <AppShell><Loader text="Loading teams..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Schools and companies" title="Teams" subtitle="Create a team for your class, club or company, share the join code, and follow everyone's progress in one table. Free, with up to 500 members per team." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white">Start a team</h2>
            <form onSubmit={create} className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm"><span className="text-slate-200">Team name</span><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. School 12, Grade 10 Cyber Club" maxLength={80} required /></label>
              <label className="block space-y-1 text-sm"><span className="text-slate-200">Description (optional)</span><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Tuesday after-school group" maxLength={300} /></label>
              {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
              <Button type="submit" disabled={busy || name.trim().length < 3} className="bg-sky-400 text-slate-950">{busy ? "Creating..." : "Create team"}</Button>
            </form>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white">Join a team</h2>
            <form onSubmit={(event) => { event.preventDefault(); navigate(`/join/${code.trim().toUpperCase()}`); }} className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm"><span className="text-slate-200">Join code from your teacher or manager</span><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="8 letters and numbers" maxLength={8} className="font-mono uppercase" /></label>
              <Button type="submit" disabled={code.trim().length !== 8} className="border border-slate-700 text-slate-100">Continue</Button>
            </form>
          </Card>
        </div>
        {data.leading.length ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Teams you lead</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.leading.map((team) => (
                <Link key={team.id} to={`/teams/${team.id}`} className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                  <Card className="p-5 transition hover:border-sky-400/40">
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{team.memberCount} {team.memberCount === 1 ? "member" : "members"} · code <span className="font-mono">{team.joinCode}</span></p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {data.memberOf.length ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Teams you belong to</h2>
            <ul className="space-y-2">
              {data.memberOf.map((team) => (
                <li key={team.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-200">
                  <span>{team.name} <span className="text-slate-500">· led by {team.leader}</span></span>
                  <button type="button" onClick={() => window.confirm(`Leave ${team.name}? ${team.leader} will stop seeing your progress.`) && void api.delete(`/teams/${team.id}/members/${user!.id}`).then(load).catch((err: Error) => setError(err.message))} className="text-xs text-slate-400 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Leave</button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
