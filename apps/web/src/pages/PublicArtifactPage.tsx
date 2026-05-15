import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Badge, Card, Loader, SectionTitle } from '../components/ui';
import type { PortfolioArtifact } from '../types';

export function PublicArtifactPage() {
  const { shareId } = useParams();
  const [artifact, setArtifact] = useState<(PortfolioArtifact & { ownerName?: string }) | null>(null);
  useEffect(() => { if (shareId) api.get<{ artifact: PortfolioArtifact & { ownerName?: string } }>(`/platform/portfolio/public/${shareId}`).then((data) => setArtifact(data.artifact)); }, [shareId]);
  if (!artifact) return <div className="min-h-screen bg-slate-950 p-8 text-slate-100"><Loader text="Loading published artifact..." /></div>;
  return <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100"><main className="mx-auto max-w-3xl space-y-6"><SectionTitle eyebrow="CyberPath public portfolio" title={artifact.title} subtitle={`Published by ${artifact.ownerName ?? 'CyberPath learner'} · ${artifact.artifactType}`} /><Card className="p-6"><Badge>{artifact.specialization}</Badge><p className="mt-4 text-slate-300">{artifact.summary}</p><h3 className="mt-6 font-semibold text-white">Defensive recommendations</h3><p className="mt-2 text-slate-300">{artifact.defensiveRecommendations || 'Recommendations are included in the learner artifact.'}</p><h3 className="mt-6 font-semibold text-white">Reflection</h3><p className="mt-2 text-slate-300">{artifact.reflection || 'No reflection provided.'}</p><p className="mt-6 text-xs text-slate-500">Public artifacts use fictional scenarios and must not include private user data.</p></Card></main></div>;
}
