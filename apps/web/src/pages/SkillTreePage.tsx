import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle } from '../components/ui';
import type { SkillTreeCategory, SkillTreeNode } from '../types';

const stateClass: Record<string, string> = {
  mastered: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100',
  proficient: 'border-sky-400/50 bg-sky-400/10 text-sky-100',
  practiced: 'border-indigo-400/50 bg-indigo-400/10 text-indigo-100',
  introduced: 'border-amber-400/50 bg-amber-400/10 text-amber-100',
  needs_review: 'border-rose-400/50 bg-rose-400/10 text-rose-100',
  not_started: 'border-slate-700 bg-slate-900 text-slate-300'
};

function SkillCard({ node }: { node: SkillTreeNode }) {
  return (
    <Card className={`p-5 ${node.recommended ? 'ring-2 ring-sky-400/50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{node.title}</h3>
            {node.recommended ? <Badge className="border-sky-400/50 text-sky-100">recommended next</Badge> : null}
            {node.locked ? <Badge>locked</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-slate-400">{node.description}</p>
        </div>
        <Badge className={stateClass[node.mastery.state] ?? stateClass.not_started}>{node.mastery.state.replace('_', ' ')} · {node.mastery.score}%</Badge>
      </div>
      {node.lockedReason ? <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">{node.lockedReason}</p> : null}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(node.mastery.score, 4)}%` }} /></div>
      <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
        <div><span className="text-slate-500">Lessons</span><p className="mt-1 text-slate-200">{node.lessons.map((item) => item.title).join(', ')}</p></div>
        <div><span className="text-slate-500">Exercises</span><p className="mt-1 text-slate-200">{node.exercises.length} adaptive item{node.exercises.length === 1 ? '' : 's'}</p></div>
        <div><span className="text-slate-500">Portfolio proof</span><p className="mt-1 text-slate-200">{node.portfolioArtifact ?? 'Optional reflection'}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to={`/skills/${node.id}`}><Button className="bg-sky-400 text-slate-950" disabled={node.locked}>Start skill</Button></Link>
        <Link to={`/practice?skillId=${node.id}&mode=review`}><Button className="border border-slate-700 bg-slate-900 text-white">Review skill</Button></Link>
        <Link to={`/practice/session?skillId=${node.id}&mode=mastery_challenge`}><Button className="border border-slate-700 bg-slate-900 text-white" disabled={node.locked}>Mastery challenge</Button></Link>
      </div>
    </Card>
  );
}

export function SkillTreePage() {
  const [data, setData] = useState<{ categories: SkillTreeCategory[]; recommendedNextSkill: SkillTreeNode | null } | null>(null);
  useEffect(() => { api.get<{ categories: SkillTreeCategory[]; recommendedNextSkill: SkillTreeNode | null }>('/learning/skill-tree').then(setData); }, []);
  if (!data) return <AppShell><Loader text="Loading skill tree..." /></AppShell>;
  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Skill tree" title="Master defensive cybersecurity one skill at a time." subtitle="Every visible node has at least one mapped lesson or exercise, clear prerequisites, mastery status, and a safe next action." />
        {data.recommendedNextSkill ? <Card className="p-5"><p className="text-sm text-slate-400">Recommended next skill</p><h2 className="mt-1 text-2xl font-semibold text-white">{data.recommendedNextSkill.title}</h2><p className="mt-2 text-slate-300">{data.recommendedNextSkill.description}</p></Card> : null}
        {data.categories.map((category) => (
          <section key={category.id} className="space-y-4">
            <div><p className="text-xs uppercase tracking-[0.25em] text-sky-300">{category.title}</p><p className="mt-1 text-sm text-slate-400">{category.description}</p></div>
            <div className="grid gap-4 xl:grid-cols-2">{category.nodes.map((node) => <SkillCard key={node.id} node={node} />)}</div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
