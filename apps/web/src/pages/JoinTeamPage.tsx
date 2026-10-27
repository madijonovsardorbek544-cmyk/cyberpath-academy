import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button, Card, ErrorMessage, Loader, SectionTitle } from "../components/ui";

type Invite = { team: { name: string; description: string; leader: string }; alreadyMember: boolean; isLeader: boolean };

export function JoinTeamPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Invite>(`/teams/invite/${encodeURIComponent(code)}`).then(setInvite).catch((err: Error) => setError(err.message));
  }, [code]);

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/teams/join", { code });
      navigate("/teams");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <SectionTitle eyebrow="Join a team" title={invite ? invite.team.name : "Team invitation"} subtitle={invite ? `Led by ${invite.team.leader}${invite.team.description ? ` · ${invite.team.description}` : ""}` : ""} />
        {!invite && !error ? <Loader text="Checking the code..." /> : null}
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {invite ? (
          <Card className="space-y-4 p-6">
            {invite.isLeader ? <p className="text-slate-200">You lead this team.</p> : invite.alreadyMember ? <p className="text-slate-200">You are already a member of this team.</p> : (
              <>
                <p className="text-sm text-slate-300">If you join, {invite.team.leader} will see your name, email, lessons completed, cases closed, XP, exam status and when you were last active. You can leave the team at any time.</p>
                <Button type="button" disabled={busy} onClick={() => void join()} className="bg-sky-400 text-slate-950">{busy ? "Joining..." : "Join team"}</Button>
              </>
            )}
            <Link to="/teams" className="block text-sm text-sky-300 hover:text-sky-200">Go to your teams</Link>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
