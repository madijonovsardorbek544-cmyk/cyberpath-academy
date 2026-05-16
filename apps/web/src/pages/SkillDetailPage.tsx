import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle } from '../components/ui';
import type { SkillTreeCategory, SkillTreeNode } from '../types';

export function SkillDetailPage() {
  const { skillId } = useParams();
  const [categories, setCategories] = useState<SkillTreeCategory[] | null>(null);
  useEffect(() => { api.get<{ categories: SkillTreeCategory[] }>('/learning/skill-tree').then((res) => setCategories(res.categories)); }, []);
  const node = useMemo(() => categories?.flatMap((category) => category.nodes).find((item) => item.id === skillId), [categories, skillId]);
  if (!categories) return <AppShell><Loader text="Loading skill detail..." /></AppShell>;
  if (!node) return <AppShell><Card className="p-6">Skill not found.</Card></AppShell>;
  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow={node.categoryTitle} title={node.title} subtitle={node.description} />
        <Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><Badge>{node.mastery.state.replace('_', ' ')} · {node.mastery.score}%</Badge><Badge>{node.locked ? node.lockedReason : 'unlocked'}</Badge></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(4, node.mastery.score)}%` }} /></div></Card>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5"><h3 className="font-semibold text-white">Lessons</h3><div className="mt-3 space-y-2">{node.lessons.map((lesson) => <Link key={lesson.id} to={`/lessons/${lesson.slug}`} className="block rounded-2xl border border-slate-800 p-3 text-sm text-slate-200">{lesson.title}</Link>)}</div></Card>
          <Card className="p-5"><h3 className="font-semibold text-white">Practice</h3><p className="mt-2 text-sm text-slate-400">Adaptive exercises update mastery and add review debt after misses.</p><Link to={`/practice/session?skillId=${node.id}`}><Button className="mt-4 bg-sky-400 text-slate-950">Practice now</Button></Link></Card>
          <Card className="p-5"><h3 className="font-semibold text-white">Labs and proof</h3><p className="mt-2 text-sm text-slate-400">{node.labs.length ? node.labs.map((lab) => lab.title).join(', ') : 'No lab required yet.'}</p><p className="mt-3 text-sm text-slate-300">Artifact: {node.portfolioArtifact}</p></Card>
        </div>
      </div>
    </AppShell>
  );
}
