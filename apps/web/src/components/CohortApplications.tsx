import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from './ui';

type Application = { id: string; name: string; contact: string; email: string | null; ageGroup: string; experience: string; goal: string; message: string | null; createdAt: string };

const ageLabel: Record<string, string> = { under_16: 'under 16 (needs parent consent)', '16_17': '16–17', '18_24': '18–24', '25_plus': '25+' };

/** Admin list of applications from the /kurs page. */
export function CohortApplicationsCard() {
  const [items, setItems] = useState<Application[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get<{ applications: Application[] }>('/admin/cohort-applications')
      .then((data) => setItems(data.applications))
      .catch((err) => { setError(err instanceof Error ? err.message : 'Could not load applications.'); setItems([]); });
  }, []);
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-white">Cohort applications {items ? `(${items.length})` : ''}</h3>
      <p className="mt-1 text-sm text-slate-400">From the Uzbek course page at /kurs. Contact each applicant yourself.</p>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {items === null ? <p className="mt-3 text-sm text-slate-400">Loading…</p> : null}
      {items?.length === 0 && !error ? <p className="mt-3 text-sm text-slate-400">No applications yet.</p> : null}
      <ul className="mt-4 space-y-2 text-sm">
        {items?.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-slate-300">
            <span className="font-medium text-white">{item.name}</span> · {item.contact}{item.email ? ` · ${item.email}` : ''} · {ageLabel[item.ageGroup] ?? item.ageGroup} · {item.experience.replace('_', ' ')} · goal: {item.goal.replace('_', ' ')} · {new Date(item.createdAt).toLocaleDateString()}
            {item.message ? <p className="mt-1 text-slate-400">“{item.message}”</p> : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
