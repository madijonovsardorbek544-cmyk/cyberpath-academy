import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../ui';
import type { LearnerProgress } from '../../types';

/** Compact XP / streak / league summary for the dashboard. Renders nothing if progress cannot load. */
export function ProgressStrip() {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  useEffect(() => {
    api.get<LearnerProgress>('/progress/me').then(setProgress).catch(() => setProgress(null));
  }, []);
  if (!progress) return null;

  const { xp, streak, league } = progress;
  return (
    <Link to="/progress" className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
      <Card className="grid gap-4 p-5 transition hover:border-sky-400/40 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <Flame className={streak.activeToday ? 'text-orange-300' : 'text-slate-500'} aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold text-white">{streak.current}-day streak</p>
            <p className="text-xs text-slate-400">{streak.activeToday ? 'Done for today' : 'Earn XP today to keep it'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Zap className="text-sky-300" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold text-white">Level {xp.level} · {xp.total} XP</p>
            <p className="text-xs text-slate-400">{xp.nextLevelXp - xp.currentLevelXp} XP to level {xp.level + 1}</p>
          </div>
        </div>
        {league ? (
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-300" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold text-white">#{league.rank} in {league.tierName}</p>
              <p className="text-xs text-slate-400">{xp.thisWeek} XP this week</p>
            </div>
          </div>
        ) : null}
      </Card>
    </Link>
  );
}
