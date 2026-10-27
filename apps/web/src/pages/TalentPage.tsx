import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Card, EmptyState, ErrorState, Loader, SectionTitle } from "../components/ui";
import type { TalentEntry } from "../types";

export function TalentPage() {
  const [talent, setTalent] = useState<TalentEntry[] | null>(null);
  const [error, setError] = useState("");
  const [certified, setCertified] = useState(false);

  const load = () => {
    setError("");
    setTalent(null);
    api.get<{ talent: TalentEntry[] }>(`/profile/talent${certified ? "?certified=1" : ""}`).then((data) => setTalent(data.talent)).catch((err: Error) => setError(err.message));
  };
  useEffect(load, [certified]);

  if (error) return <AppShell><ErrorState title="Could not load the list" description={error} onAction={load} /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/jobs" className="text-sm text-sky-300 hover:text-sky-200">← Jobs board</Link>
        <SectionTitle eyebrow="Careers" title="Learners open to work" subtitle="Only learners who published their profile and turned on 'Open to work' appear here. Each profile shows earned work, never an email address: contact people through the links they share." />
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={certified} onChange={(event) => setCertified(event.target.checked)} className="h-4 w-4" /> Passed the CPA-1 practical exam</label>
        {!talent ? <Loader text="Loading..." /> : talent.length === 0 ? (
          <EmptyState title="Nobody here yet" description={certified ? "No certified learners are open to work right now." : "Learners can opt in from their Streak & League page."} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {talent.map((person) => (
              <li key={person.handle}>
                <Link to={`/u/${person.handle}`} className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                  <Card className="space-y-2 p-5 transition hover:border-sky-400/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-semibold text-white">{person.name}</h2>
                      {person.certified ? <Badge className="border-emerald-400/40 text-emerald-200">CPA-1 certified</Badge> : null}
                    </div>
                    {person.headline ? <p className="text-sm text-slate-300">{person.headline}</p> : null}
                    <p className="text-xs text-slate-400">Level {person.level} · {person.totalXp} XP · {person.casesClosed} {person.casesClosed === 1 ? "case" : "cases"} closed · {person.badges} {person.badges === 1 ? "badge" : "badges"}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
