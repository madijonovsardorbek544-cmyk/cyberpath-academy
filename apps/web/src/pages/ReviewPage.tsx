import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle } from '../components/ui';
import type { Exercise, SkillTreeNode } from '../types';

export function ReviewPage() {
  const [review, setReview] = useState<{ skill: SkillTreeNode; exercises: Exercise[] }[] | null>(null);
  useEffect(() => { api.get<{ review: { skill: SkillTreeNode; exercises: Exercise[] }[] }>('/learning/review').then((res) => setReview(res.review)); }, []);
  if (!review) return <AppShell><Loader text="Loading review queue..." /></AppShell>;
  return <AppShell><div className="space-y-6"><SectionTitle eyebrow="Spaced review" title="Protect mastery from getting stale." subtitle="Review focuses on stale or weak skills and uses safe fictional prompts." />{review.map((item) => <Card key={item.skill.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="text-lg font-semibold text-white">{item.skill.title}</h3><Badge>{item.skill.mastery.state.replace('_', ' ')} · {item.skill.mastery.score}%</Badge></div><p className="mt-2 text-sm text-slate-400">{item.exercises.length} review prompt{item.exercises.length === 1 ? '' : 's'} ready.</p><Link to={`/practice/session?skillId=${item.skill.id}&mode=review`}><Button className="mt-4 bg-sky-400 text-slate-950">Start review</Button></Link></Card>)}</div></AppShell>;
}
