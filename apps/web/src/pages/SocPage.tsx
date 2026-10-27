import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Card, ErrorState, Loader, SectionTitle } from "../components/ui";
import type { SocShiftListItem } from "../types";

export function SocPage() {
  const [shifts, setShifts] = useState<SocShiftListItem[] | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api.get<{ shifts: SocShiftListItem[] }>("/soc/shifts").then((data) => setShifts(data.shifts)).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <AppShell><ErrorState title="Could not load the SOC simulator" description={error} onAction={load} /></AppShell>;
  if (!shifts) return <AppShell><Loader text="Loading alert queues..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle
          eyebrow="SOC simulator"
          title="Work a shift as a junior SOC analyst."
          subtitle="Each shift is a queue of SIEM alerts. Decide which are real, set a severity, and write a case note. You are scored on accuracy, severity and the quality of your notes."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {shifts.map((shift) => (
            <Link key={shift.slug} to={`/soc/${shift.slug}`} className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
              <Card className="flex h-full flex-col p-5 transition hover:border-sky-400/40">
                <div className="flex flex-wrap gap-2"><Badge>{shift.difficulty}</Badge><Badge>{shift.alertCount} alerts</Badge><Badge>~{shift.estimatedMinutes} min</Badge></div>
                <h2 className="mt-4 text-xl font-semibold text-white">{shift.title}</h2>
                <p className="mt-3 flex-1 text-sm text-slate-400">{shift.summary}</p>
                <p className="mt-4 text-xs text-slate-500">
                  {shift.attempts ? `Best score ${shift.bestScore} / ${shift.maxScore} · ${shift.attempts} ${shift.attempts === 1 ? "shift" : "shifts"} worked` : "Not started yet"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
