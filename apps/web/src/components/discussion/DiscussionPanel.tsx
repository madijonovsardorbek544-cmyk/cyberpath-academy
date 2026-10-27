import { useEffect, useState } from "react";
import { Flag, Lock, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { Badge, Button, Card, ErrorMessage, Input, Textarea } from "../ui";
import type { DiscussionPost, DiscussionThread } from "../../types";

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function PostItem({ post, canDelete, onChanged }: { post: DiscussionPost; canDelete: boolean; onChanged: () => void }) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const report = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await api.post(`/discussions/posts/${post.id}/report`, { reason });
      setReporting(false);
      setNote("Thanks. A mentor will take a look.");
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const remove = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/discussions/posts/${post.id}`);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <li className={`rounded-2xl border p-4 ${post.status === "hidden" ? "border-amber-400/30 bg-amber-400/5" : "border-slate-800 bg-slate-950/40"}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-200">{post.author}</span>
        {post.authorRole ? <Badge className="border-sky-400/40 py-0 text-sky-200">{post.authorRole}</Badge> : null}
        <span>{when(post.createdAt)}{post.updatedAt !== post.createdAt ? " · edited" : ""}</span>
        {post.status === "hidden" ? <span className="text-amber-200">Hidden while a mentor reviews it</span> : null}
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{post.body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        {!post.isMine && !note ? (
          <button type="button" onClick={() => setReporting((open) => !open)} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" aria-expanded={reporting}>
            <Flag size={12} aria-hidden="true" /> Report
          </button>
        ) : null}
        {canDelete ? (
          <button type="button" onClick={() => void remove()} className="flex items-center gap-1 text-slate-400 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <Trash2 size={12} aria-hidden="true" /> Delete
          </button>
        ) : null}
        {note ? <span className="text-emerald-300" role="status">{note}</span> : null}
      </div>
      {reporting ? (
        <form onSubmit={report} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`report-${post.id}`} className="sr-only">Why are you reporting this post?</label>
          <Input id={`report-${post.id}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What is wrong? e.g. spoiler, rude, spam" maxLength={300} />
          <Button type="submit" disabled={reason.trim().length < 3} className="shrink-0 border border-slate-700 text-slate-100">Send report</Button>
        </form>
      ) : null}
      {error ? <div className="mt-2"><ErrorMessage>{error}</ErrorMessage></div> : null}
    </li>
  );
}

function Composer({ label, placeholder, initial, minLength, maxLength, submitLabel, onSubmit }: { label: string; placeholder: string; initial?: string; minLength: number; maxLength: number; submitLabel: string; onSubmit: (body: string) => Promise<void> }) {
  const [body, setBody] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = `composer-${label.replace(/\W+/g, "-").toLowerCase()}`;
  useEffect(() => setBody(initial ?? ""), [initial]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(body.trim());
      if (initial === undefined) setBody("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const length = body.trim().length;
  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">{label}</label>
      <Textarea id={id} value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} maxLength={maxLength} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{length < minLength ? `At least ${minLength} characters` : `${length} / ${maxLength}`}</span>
        <Button type="submit" disabled={busy || length < minLength} className="bg-sky-400 text-slate-950">{busy ? "Posting..." : submitLabel}</Button>
      </div>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </form>
  );
}

/** Comments for lessons and cases, plus writeups on cases that unlock once the learner has solved it. */
export function DiscussionPanel({ targetType, slug, refreshKey }: { targetType: "lesson" | "case"; slug: string; refreshKey?: unknown }) {
  const { user } = useAuth();
  const [thread, setThread] = useState<DiscussionThread | null>(null);
  const [tab, setTab] = useState<"comments" | "writeups">("comments");
  const [error, setError] = useState("");
  const staff = user?.role === "mentor" || user?.role === "admin";

  const load = () => {
    setError("");
    api.get<DiscussionThread>(`/discussions/${targetType}/${slug}`).then(setThread).catch((err: Error) => setError(err.message));
  };
  useEffect(load, [targetType, slug, refreshKey]);

  const post = async (kind: "comment" | "writeup", body: string) => {
    await api.post(`/discussions/${targetType}/${slug}`, { kind, body });
    load();
  };

  if (error) return <Card className="p-5"><ErrorMessage>{error}</ErrorMessage></Card>;
  if (!thread) return null;
  const myWriteup = thread.writeups.find((item) => item.isMine);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Discussion</h2>
        {thread.writeupsAllowed ? (
          <div className="flex rounded-2xl border border-slate-700 p-1 text-sm" role="group" aria-label="Discussion view">
            {(["comments", "writeups"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={tab === option} onClick={() => setTab(option)} className={`rounded-xl px-3 py-1 capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${tab === option ? "bg-sky-400 text-slate-950" : "text-slate-300"}`}>
                {option} ({option === "comments" ? thread.comments.length : thread.writeupsUnlocked ? thread.writeups.length : "locked"})
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {tab === "comments" ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400">Ask questions and help others. {targetType === "case" ? "Please do not post answers here; share your method in a writeup after you solve the case." : "Be kind and stay on topic."}</p>
          {thread.comments.length ? (
            <ul className="space-y-3">{thread.comments.map((item) => <PostItem key={item.id} post={item} canDelete={item.isMine || staff} onChanged={load} />)}</ul>
          ) : <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>}
          <Composer label="Add a comment" placeholder="What was unclear, or what helped you?" minLength={2} maxLength={2000} submitLabel="Post comment" onSubmit={(body) => post("comment", body)} />
        </div>
      ) : thread.writeupsUnlocked ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400">Writeups explain how someone solved the case. Only learners who finished it can see them.</p>
          {thread.writeups.length ? (
            <ul className="space-y-3">{thread.writeups.map((item) => <PostItem key={item.id} post={item} canDelete={item.isMine || staff} onChanged={load} />)}</ul>
          ) : <p className="text-sm text-slate-500">No writeups yet. Be the first to explain your approach.</p>}
          {thread.canWriteWriteup ? (
            <Composer label={myWriteup ? "Edit your writeup" : "Write your writeup"} placeholder="Which evidence did you start with? Which commands or filters helped? What would you check next in a real SOC?" initial={myWriteup?.body} minLength={80} maxLength={8000} submitLabel={myWriteup ? "Save writeup" : "Publish writeup"} onSubmit={(body) => post("writeup", body)} />
          ) : null}
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Lock size={14} aria-hidden="true" /> Writeups unlock when you finish this case, so nobody spoils it for you.</p>
      )}
    </Card>
  );
}
