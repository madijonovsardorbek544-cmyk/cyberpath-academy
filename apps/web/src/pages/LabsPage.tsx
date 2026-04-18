import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import type { Lab } from "../types";
import { Badge, Card, Loader, SectionTitle } from "../components/ui";

export function LabsPage() {
  const [labs, setLabs] = useState<Lab[] | null>(null);

  useEffect(() => {
    api.get<{ labs: Lab[] }>("/learning/labs").then((data) => setLabs(data.labs));
  }, []);

  if (!labs) return <AppShell><Loader text="Loading safe labs..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Safe labs" title="Sandboxed, defensive, and explicitly authorized learning only." subtitle="These labs build analysis, triage, and remediation skill in toy environments. No live-target workflows. No malware deployment. No credential theft guidance." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {labs.map((lab) => (
            <Link key={lab.id} to={`/labs/${lab.slug}`}>
              <Card className="h-full p-5 transition hover:border-sky-400/40">
                <div className="flex flex-wrap gap-2"><Badge>{lab.category}</Badge><Badge>{lab.difficulty}</Badge></div>
                <h3 className="mt-4 text-xl font-semibold text-white">{lab.title}</h3>
                <p className="mt-3 text-sm text-slate-400">{lab.description}</p>
                <p className="mt-4 text-xs text-slate-500">{lab.safeGuardrails}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
