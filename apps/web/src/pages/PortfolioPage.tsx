import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { BetaFeedbackCard } from '../components/BetaMode';
import { Badge, Button, Card, Input, Loader, SectionTitle, Textarea } from '../components/ui';
import type { PortfolioArtifact } from '../types';

const artifactTypes = ['incident-report', 'phishing-triage-note', 'access-review-memo', 'password-policy-audit', 'secure-code-review-summary', 'cloud-iam-review', 'risk-register', 'executive-summary', 'capstone-plan'];

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioArtifact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', artifactType: 'incident-report', specialization: 'SOC analyst', summary: '', scenario: '', evidenceUsed: '', riskExplanation: '', defensiveRecommendations: '', reflection: '' });

  const refresh = () => api.get<{ portfolio: PortfolioArtifact[] }>('/learning/portfolio').then((data) => setPortfolio(data.portfolio));
  useEffect(() => { void refresh(); }, []);

  async function createArtifact() {
    setError(null);
    try {
      await api.post('/learning/portfolio', { ...form, deliverables: ['summary', 'evidence', 'recommendations'], evidenceUsed: form.evidenceUsed.split('\n').map((item) => item.trim()).filter(Boolean) });
      setForm({ title: '', artifactType: 'incident-report', specialization: 'SOC analyst', summary: '', scenario: '', evidenceUsed: '', riskExplanation: '', defensiveRecommendations: '', reflection: '' });
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create artifact.'); }
  }

  async function setStatus(id: string, status: 'draft' | 'published') {
    setError(null);
    try { await api.patch(`/learning/portfolio/${id}`, { status }); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update artifact.'); }
  }

  if (!portfolio) return <AppShell><Loader text="Loading portfolio..." /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Proof of work" title="Portfolio artifacts" subtitle="Create safe, defensive artifacts from labs and guided projects. Only published artifacts get public read-only share links." />
        {error ? <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">{error}</div> : null}
        <div className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">Create artifact draft</h3>
            <div className="mt-4 grid gap-3">
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100" value={form.artifactType} onChange={(e) => setForm({ ...form, artifactType: e.target.value })}>{artifactTypes.map((type) => <option key={type}>{type}</option>)}</select>
              <Input placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              <Textarea placeholder="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              <Textarea placeholder="Scenario (fictional context only)" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
              <Textarea placeholder="Evidence used (one fact per line)" value={form.evidenceUsed} onChange={(e) => setForm({ ...form, evidenceUsed: e.target.value })} />
              <Textarea placeholder="Risk explanation" value={form.riskExplanation} onChange={(e) => setForm({ ...form, riskExplanation: e.target.value })} />
              <Textarea placeholder="Defensive recommendations" value={form.defensiveRecommendations} onChange={(e) => setForm({ ...form, defensiveRecommendations: e.target.value })} />
              <Textarea placeholder="Reflection" value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} />
              <Button className="bg-sky-400 text-slate-950" onClick={createArtifact}>Create draft</Button>
            </div>
          </Card>
          <div className="grid gap-4">
            {portfolio.map((artifact) => (
              <Card key={artifact.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-white">{artifact.title}</h3><p className="mt-1 text-sm text-slate-400">{artifact.artifactType} · {artifact.specialization}</p></div><Badge>{artifact.status}</Badge></div>
                <p className="mt-3 text-sm text-slate-300">{artifact.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2"><Button className="border border-slate-700 bg-slate-900 text-white" onClick={() => setStatus(artifact.id, 'published')}>Publish</Button><Button className="border border-slate-700 bg-slate-900 text-white" onClick={() => setStatus(artifact.id, 'draft')}>Unpublish</Button>{artifact.publicShareId ? <a className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-sky-200" href={`#/public/artifacts/${artifact.publicShareId}`}>Public view</a> : null}</div>
              </Card>
            ))}
          </div>
        </div>
        <BetaFeedbackCard context="artifact_creation" title="Artifact feedback" />
      </div>
    </AppShell>
  );
}
