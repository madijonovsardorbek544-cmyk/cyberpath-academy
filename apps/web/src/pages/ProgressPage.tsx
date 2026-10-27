import { useEffect, useState } from 'react';
import { Award, Flame, Lock, Snowflake, Trophy } from 'lucide-react';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Card, ErrorState, Loader, SectionTitle } from '../components/ui';
import type { LearnerProgress } from '../types';
import { ProfileSettingsCard } from '../components/progress/ProfileSettingsCard';

function daysLeft(weekEnds: string) {
  const ms = new Date(`${weekEnds}T00:00:00Z`).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(ms / 86_400_000));
  return days <= 1 ? 'Ends today' : `${days} days left`;
}

export function ProgressPage() {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api.get<LearnerProgress>('/progress/me').then(setProgress).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <AppShell><ErrorState title="Could not load your progress" description={error} onAction={load} /></AppShell>;
  if (!progress) return <AppShell><Loader text="Counting your XP..." /></AppShell>;
  const { xp, streak, league, badges, recent } = progress;
  const levelPercent = Math.round((xp.currentLevelXp / xp.nextLevelXp) * 100);
  const earned = badges.filter((badge) => badge.earnedAt).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Streak & league" title="Show up a little every day." subtitle="Earn XP from lessons, quizzes, labs, investigations, SOC shifts and practice. Any XP keeps your streak alive, and each week you compete in a league of up to 30 learners." />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm text-slate-400"><Flame size={16} className="text-orange-300" aria-hidden="true" /> Streak</p>
            <p className="mt-2 text-3xl font-semibold text-white">{streak.current} {streak.current === 1 ? 'day' : 'days'}</p>
            <p className="mt-2 text-xs text-slate-400">{streak.activeToday ? 'You have earned XP today.' : 'Earn any XP today to keep your streak.'}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-sky-200"><Snowflake size={12} aria-hidden="true" /> {streak.freezeAvailableThisWeek ? 'Streak freeze ready: one missed day this week is forgiven.' : 'Streak freeze used this week.'}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-400">Level {xp.level}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{xp.total} XP</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={levelPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to level ${xp.level + 1}`}>
              <div className="h-full rounded-full bg-sky-400" style={{ width: `${levelPercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{xp.nextLevelXp - xp.currentLevelXp} XP to level {xp.level + 1}</p>
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm text-slate-400"><Award size={16} className="text-amber-300" aria-hidden="true" /> Badges</p>
            <p className="mt-2 text-3xl font-semibold text-white">{earned} / {badges.length}</p>
            <p className="mt-2 text-xs text-slate-400">{xp.thisWeek} XP earned this week</p>
          </Card>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {league ? (
            <Card className="min-w-0 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Trophy size={18} className="text-amber-300" aria-hidden="true" /> {league.tierName} league</h2>
                <Badge>{daysLeft(league.weekEnds)}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {league.promoteCount ? `Top ${league.promoteCount} with XP move up next week.` : 'Top league: hold your place.'}
                {league.demoteCount ? ` Bottom ${league.demoteCount} move down.` : ''}
              </p>
              <ol className="mt-4 space-y-1">
                {league.members.map((member) => {
                  const zone = league.promoteCount && member.rank <= league.promoteCount && member.xp > 0 ? 'up' : league.demoteCount && member.rank > league.members.length - league.demoteCount ? 'down' : null;
                  return (
                    <li key={`${member.rank}-${member.name}`} className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${member.isMe ? 'bg-sky-400/15 text-sky-100' : 'text-slate-200'}`}>
                      <span className="flex items-center gap-3">
                        <span className={`w-6 text-right font-mono ${zone === 'up' ? 'text-emerald-300' : zone === 'down' ? 'text-rose-300' : 'text-slate-500'}`}>{member.rank}</span>
                        {member.name}{member.isMe ? ' (you)' : ''}
                      </span>
                      <span className="font-mono text-xs">{member.xp} XP</span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          ) : (
            <Card className="p-5"><p className="text-sm text-slate-400">Leagues are for learner accounts.</p></Card>
          )}

          <Card className="min-w-0 p-5">
            <h2 className="text-lg font-semibold text-white">Recent XP</h2>
            {recent.length ? (
              <ul className="mt-3 space-y-2">
                {recent.map((event) => (
                  <li key={`${event.at}-${event.label}`} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 text-slate-300">{event.label}<span className="block text-xs text-slate-500">{new Date(event.at).toLocaleDateString()}</span></span>
                    <span className="shrink-0 font-mono text-xs text-sky-200">+{event.xp}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-400">No XP yet. Finish a lesson or solve a case question to start.</p>}
          </Card>
        </div>

        <ProfileSettingsCard />

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white">Badges</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {badges.map((badge) => (
              <li key={badge.id} className={`rounded-2xl border p-4 ${badge.earnedAt ? 'border-amber-300/40 bg-amber-300/5' : 'border-slate-800 opacity-70'}`}>
                <p className="flex items-center gap-2 font-medium text-white">
                  {badge.earnedAt ? <Award size={16} className="text-amber-300" aria-hidden="true" /> : <Lock size={14} className="text-slate-500" aria-hidden="true" />}
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">{badge.description}</p>
                <p className="mt-2 text-[11px] text-slate-500">{badge.earnedAt ? `Earned ${new Date(badge.earnedAt).toLocaleDateString()}` : 'Not earned yet'}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
