import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Lock } from "lucide-react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Card, ErrorState, Loader, SectionTitle } from "../components/ui";
import type { EventDay, EventResponse } from "../types";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

function DayCard({ day }: { day: EventDay }) {
  const body = (
    <Card className={`flex h-full flex-col p-4 transition ${day.unlocked ? "hover:border-sky-400/40" : "opacity-60"} ${day.completed ? "border-emerald-400/30" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-400">Day {day.day}</span>
        {day.completed ? <CheckCircle2 size={16} className="text-emerald-300" aria-label="Completed" /> : !day.unlocked ? <Lock size={14} className="text-slate-500" aria-hidden="true" /> : null}
      </div>
      {day.unlocked ? (
        <>
          <h2 className="mt-2 font-semibold text-white">{day.title.replace(/^Day \d+: /, "")}</h2>
          <p className="mt-2 flex-1 text-sm text-slate-400">{day.summary}</p>
          <p className="mt-3 text-xs text-slate-500">{day.pointsEarned} / {day.totalPoints} pts</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Unlocks {dateLabel(day.unlocksAt)}</p>
      )}
    </Card>
  );
  return day.unlocked
    ? <Link to={`/cases/${day.slug}`} className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">{body}</Link>
    : <div aria-label={`Day ${day.day}, locked until ${dateLabel(day.unlocksAt)}`}>{body}</div>;
}

export function EventPage() {
  const [data, setData] = useState<EventResponse | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api.get<EventResponse>("/event").then(setData).catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <AppShell><ErrorState title="Could not load the event" description={error} onAction={load} /></AppShell>;
  if (!data) return <AppShell><Loader text="Loading the event..." /></AppShell>;
  const { event, days, leaderboard, me } = data;
  const status = {
    upcoming: `Starts ${dateLabel(event.startsAt)}. One new case unlocks every day at 00:00 UTC.`,
    live: `Live now. The leaderboard counts solves until ${dateLabel(event.closesAt)}.`,
    closed: "The event has ended and the leaderboard is final. Every day stays open for practice."
  }[event.status];

  return (
    <AppShell>
      <div className="space-y-8">
        <SectionTitle eyebrow="Free yearly event" title={event.title} subtitle={event.summary} />
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={event.status === "live" ? "border-emerald-400/40 text-emerald-200" : undefined}>{event.status}</Badge>
          <p className="text-sm text-slate-300">{status}</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => <DayCard key={day.slug} day={day} />)}
          </div>
          <Card className="h-fit p-5">
            <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
            <p className="mt-1 text-xs text-slate-400">Points first, then whoever reached them earlier.</p>
            {me ? <p className="mt-3 text-sm text-sky-200">You are #{me.rank} with {me.points} pts.</p> : <p className="mt-3 text-sm text-slate-400">Solve a question to join the board.</p>}
            {leaderboard.length ? (
              <ol className="mt-4 space-y-2">
                {leaderboard.map((row) => (
                  <li key={row.rank} className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${row.isMe ? "bg-sky-400/10 text-sky-100" : "text-slate-200"}`}>
                    <span><span className="mr-2 font-mono text-xs text-slate-500">{row.rank}</span>{row.name}</span>
                    <span className="font-mono text-xs">{row.points} pts</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-4 text-sm text-slate-500">No solves yet.</p>}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
