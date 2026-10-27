import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button, Card, EmptyState, ErrorMessage, ErrorState, Loader, SectionTitle } from "../components/ui";
import type { TeamMember, TeamSummary } from "../types";

const examLabel: Record<string, string> = { passed: "Passed", submitted: "Awaiting grade", in_progress: "In progress", failed: "Not passed" };

// Learners choose their own names, so formula-looking cells are prefixed to keep spreadsheets from running them.
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"`;

function joinUrl(code: string) {
  return `${window.location.origin}${window.location.pathname}#/join/${code}`;
}

export function TeamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ team: TeamSummary; members: TeamMember[] } | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = () => {
    setError("");
    api.get<{ team: TeamSummary; members: TeamMember[] }>(`/teams/${id}`).then(setData).catch((err: Error) => setError(err.message));
  };
  useEffect(load, [id]);

  const act = async (run: () => Promise<unknown>) => {
    setActionError("");
    try {
      await run();
      load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const exportCsv = () => {
    const rows = [["name", "email", "joined_at", "lessons_completed", "cases_closed", "xp", "exam_status", "last_active_at"], ...data!.members.map((member) => [member.name, member.email, member.joinedAt, member.lessonsCompleted, member.casesClosed, member.xp, member.examStatus ?? "", member.lastActiveAt ?? ""])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data!.team.name.replace(/[^\w-]+/g, "-")}-progress.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <AppShell><ErrorState title="Could not load this team" description={error} onAction={load} /></AppShell>;
  if (!data) return <AppShell><Loader text="Loading team..." /></AppShell>;
  const { team, members } = data;
  const link = team.joinCode ? joinUrl(team.joinCode) : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/teams" className="text-sm text-sky-300 hover:text-sky-200">← All teams</Link>
        <SectionTitle eyebrow="Team" title={team.name} subtitle={team.description || `${team.memberCount} ${team.memberCount === 1 ? "member" : "members"}`} />
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold text-white">Invite people</h2>
          <p className="text-sm text-slate-300">Share the code or link. People who join can see the team name and your name; you can see their name, email and progress.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-slate-700 px-4 py-2 font-mono text-lg tracking-widest text-white">{team.joinCode}</span>
            <Button type="button" onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true))} className="border border-slate-700 text-slate-100">{copied ? "Link copied" : "Copy join link"}</Button>
            <Button type="button" onClick={() => window.confirm("Make a new code? The old code and link stop working.") && void act(() => api.post(`/teams/${team.id}/rotate-code`))} className="border border-slate-700 text-slate-100">New code</Button>
          </div>
        </Card>
        {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}
        {members.length === 0 ? <EmptyState title="No members yet" description="Share the join code. Members appear here as soon as they join." /> : (
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Progress ({members.length})</h2>
              <Button type="button" onClick={exportCsv} className="border border-slate-700 text-slate-100">Download CSV</Button>
            </div>
            <div className="relative mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="py-2 pr-3">Name</th><th className="pr-3">Lessons</th><th className="pr-3">Cases</th><th className="pr-3">XP</th><th className="pr-3">Exam</th><th className="pr-3">Last active</th><th><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t border-slate-800 text-slate-200">
                      <td className="py-2 pr-3"><span className="block">{member.name}</span><span className="text-xs text-slate-500">{member.email}</span></td>
                      <td className="pr-3">{member.lessonsCompleted}</td>
                      <td className="pr-3">{member.casesClosed}</td>
                      <td className="pr-3">{member.xp}</td>
                      <td className="pr-3">{member.examStatus ? examLabel[member.examStatus] ?? member.examStatus : "—"}</td>
                      <td className="pr-3">{member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : "Not yet"}</td>
                      <td className="text-right"><button type="button" onClick={() => window.confirm(`Remove ${member.name} from the team?`) && void act(() => api.delete(`/teams/${team.id}/members/${member.id}`))} className="text-xs text-slate-400 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <button type="button" onClick={() => window.confirm("Delete this team? Members keep their own progress.") && void api.delete(`/teams/${team.id}`).then(() => navigate("/teams")).catch((err: Error) => setActionError(err.message))} className="text-sm text-slate-400 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Delete team</button>
      </div>
    </AppShell>
  );
}
