import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, ErrorMessage, Loader, SectionTitle } from "../components/ui";
import type { ModerationPost } from "../types";

function ModerationCard({ post, onDone }: { post: ModerationPost; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const act = async (run: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await run();
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const target = post.targetType === "lesson" ? `/lessons/${post.targetSlug}` : `/cases/${post.targetSlug}`;

  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge className={post.status === "hidden" ? "border-amber-400/40 text-amber-200" : undefined}>{post.status}</Badge>
        <Badge>{post.kind}</Badge>
        <span className="text-slate-400">{post.reportCount} {post.reportCount === 1 ? "report" : "reports"} · by {post.author} on <Link to={target} className="text-sky-300 hover:text-sky-200">{post.targetSlug}</Link></span>
      </div>
      <p className="whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-3 text-sm text-slate-200">{post.body}</p>
      {post.reasons.length ? <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">{post.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul> : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void act(() => api.post(`/discussions/posts/${post.id}/moderate`, { action: "restore" }))} className="bg-emerald-400 text-slate-950">Keep and clear reports</Button>
        {post.status !== "hidden" ? <Button type="button" disabled={busy} onClick={() => void act(() => api.post(`/discussions/posts/${post.id}/moderate`, { action: "hide" }))} className="border border-amber-400/40 text-amber-100">Hide</Button> : null}
        <Button type="button" disabled={busy} onClick={() => window.confirm("Delete this post for good?") && void act(() => api.delete(`/discussions/posts/${post.id}`))} className="border border-rose-400/40 text-rose-100">Delete</Button>
      </div>
    </Card>
  );
}

export function DiscussionModerationPage() {
  const [posts, setPosts] = useState<ModerationPost[] | null>(null);
  const [error, setError] = useState("");
  const load = () => api.get<{ posts: ModerationPost[] }>("/discussions/moderation").then((data) => setPosts(data.posts)).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionTitle eyebrow="Mentor review" title="Reported discussion posts" subtitle="Posts hide automatically after three reports. Keep the ones that are fine, delete the ones that break the rules." />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {!posts ? <Loader text="Loading reports..." /> : posts.length === 0 ? <EmptyState title="All clear" description="Reported posts will appear here." /> : posts.map((post) => <ModerationCard key={post.id} post={post} onDone={() => void load()} />)}
      </div>
    </AppShell>
  );
}
