import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, CircleDot, XCircle } from "lucide-react";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, ErrorMessage, ErrorState, Loader, Select, Textarea } from "../components/ui";
import type { AlertSeverity, AlertVerdict, SocShiftDetailResponse, SocShiftResult, SocSubmitResponse } from "../types";

type Draft = { verdict?: AlertVerdict; severity?: AlertSeverity; note: string };

const severityStyle: Record<AlertSeverity, string> = {
  low: "border-slate-600 text-slate-300",
  medium: "border-amber-400/40 text-amber-200",
  high: "border-orange-400/50 text-orange-200",
  critical: "border-rose-400/60 text-rose-200"
};

function isComplete(draft: Draft | undefined) {
  return Boolean(draft?.verdict && draft.note.trim().length >= 20 && (draft.verdict === "false_positive" || draft.severity));
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function ShiftReport({ result, data, onRestart }: { result: SocShiftResult; data: SocShiftDetailResponse; onRestart: () => void }) {
  const titles = new Map(data.shift.alerts.map((alert) => [alert.id, alert.title]));
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Shift report</p>
        <p className="mt-2 text-3xl font-semibold text-white">{result.score} / {result.maxScore}</p>
        <p className="mt-1 text-sm text-slate-400">{result.correctVerdicts} of {result.totalAlerts} verdicts correct · best {data.bestScore ?? result.score} · {data.attempts} {data.attempts === 1 ? "shift" : "shifts"} worked</p>
        <Button className="mt-4 bg-sky-400 text-slate-950" onClick={onRestart}>Work this shift again</Button>
      </Card>
      {result.alerts.map((alert) => (
        <Card key={alert.alertId} className={`p-5 ${alert.verdictCorrect ? "border-emerald-400/30" : "border-rose-400/30"}`}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 font-medium text-white">
              {alert.verdictCorrect ? <CheckCircle2 size={18} className="shrink-0 text-emerald-300" aria-label="Correct verdict" /> : <XCircle size={18} className="shrink-0 text-rose-300" aria-label="Wrong verdict" />}
              {titles.get(alert.alertId)}
            </h3>
            <span className="shrink-0 font-mono text-xs text-slate-400">{alert.points} / {alert.maxPoints}</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            You said {alert.verdict === "true_positive" ? "true positive" : "false positive"}. Answer: {alert.expectedVerdict === "true_positive" ? `true positive, ${alert.expectedSeverity} severity` : "false positive"}.
            {" "}Severity {alert.severityPoints}/5 · note {alert.notePoints}/5
          </p>
          <p className="mt-3 text-sm text-slate-200">{alert.explanation}</p>
          {alert.missedNoteChecks.length ? <p className="mt-2 text-xs text-amber-200">Your note could also cover: {alert.missedNoteChecks.join("; ")}.</p> : null}
        </Card>
      ))}
    </div>
  );
}

export function SocShiftPage() {
  const { slug } = useParams();
  const [data, setData] = useState<SocShiftDetailResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [activeId, setActiveId] = useState<string>("");
  const [result, setResult] = useState<SocShiftResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());

  const load = () => {
    if (!slug) return;
    setLoadError("");
    api.get<SocShiftDetailResponse>(`/soc/shifts/${slug}`).then((response) => {
      setData(response);
      setActiveId(response.shift.alerts[0]?.id ?? "");
    }).catch((err: Error) => setLoadError(err.message));
  };
  useEffect(load, [slug]);

  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [result]);

  if (loadError) return <AppShell><ErrorState title="Could not load this shift" description={loadError} onAction={load} /></AppShell>;
  if (!data) return <AppShell><Loader text="Opening the alert queue..." /></AppShell>;

  const { shift } = data;
  const active = shift.alerts.find((alert) => alert.id === activeId) ?? shift.alerts[0];
  const draft = drafts[active.id] ?? { note: "" };
  const done = shift.alerts.filter((alert) => isComplete(drafts[alert.id])).length;
  const update = (patch: Partial<Draft>) => setDrafts((current) => ({ ...current, [active.id]: { ...(current[active.id] ?? { note: "" }), ...patch } }));

  const restart = () => {
    setResult(null);
    setDrafts({});
    setActiveId(shift.alerts[0].id);
    startedAt.current = Date.now();
    setElapsed(0);
  };

  const endShift = async () => {
    setBusy(true);
    setSubmitError("");
    try {
      const decisions = shift.alerts.map((alert) => {
        const entry = drafts[alert.id];
        return { alertId: alert.id, verdict: entry.verdict, severity: entry.verdict === "true_positive" ? entry.severity : undefined, note: entry.note.trim() };
      });
      const response = await api.post<SocSubmitResponse>(`/soc/shifts/${shift.slug}/submit`, { decisions, durationSeconds: elapsed });
      setResult(response.result);
      setData({ ...data, attempts: response.attempts, bestScore: response.bestScore, lastResult: response.result });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/soc" className="text-sm text-sky-300 hover:text-sky-200">← All shifts</Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{shift.title}</h1>
          <p className="max-w-3xl text-slate-300">{shift.briefing}</p>
        </div>

        {result ? <ShiftReport result={result} data={data} onRestart={restart} /> : (
          <>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span>{done} of {shift.alerts.length} alerts decided</span>
              <span className="font-mono" aria-label="Shift timer">⏱ {formatDuration(elapsed)}</span>
              {data.bestScore !== null ? <span>Best score {data.bestScore}</span> : null}
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Card className="min-w-0 p-3 lg:self-start">
                <h2 className="px-2 py-1 text-sm font-semibold text-white">Alert queue</h2>
                <ul className="mt-1 space-y-1">
                  {shift.alerts.map((alert) => {
                    const complete = isComplete(drafts[alert.id]);
                    return (
                      <li key={alert.id}>
                        <button onClick={() => setActiveId(alert.id)} aria-current={alert.id === active.id} className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${alert.id === active.id ? "bg-sky-400/10" : "hover:bg-slate-800/60"}`}>
                          {complete ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" aria-label="Decided" /> : <CircleDot size={16} className="mt-0.5 shrink-0 text-slate-500" aria-label="Open" />}
                          <span className="min-w-0">
                            <span className="block text-sm text-slate-100">{alert.title}</span>
                            <span className={`mt-1 inline-flex rounded-full border px-2 text-[11px] uppercase tracking-wide ${severityStyle[alert.siemSeverity]}`}>{alert.siemSeverity}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <div className="min-w-0 space-y-4">
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-2"><Badge className={severityStyle[active.siemSeverity]}>SIEM: {active.siemSeverity}</Badge><Badge>{active.rule}</Badge></div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{active.title}</h2>
                  <p className="mt-1 font-mono text-xs text-slate-400">{active.time}</p>
                  <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Object.entries(active.entities).map(([label, value]) => (
                      <div key={label} className="min-w-0 rounded-2xl bg-slate-950/60 px-3 py-2">
                        <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label.replace(/_/g, " ")}</dt>
                        <dd className="break-words font-mono text-sm text-slate-100">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3 className="mt-5 text-sm font-semibold text-white">Raw event</h3>
                  <pre className="mt-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-6 text-slate-200">{active.rawEvent}</pre>
                  <h3 className="mt-5 text-sm font-semibold text-white">Context</h3>
                  <ul className="mt-2 space-y-2">
                    {active.context.map((item) => <li key={item.label} className="text-sm text-slate-300"><span className="font-medium text-slate-100">{item.label}:</span> {item.value}</li>)}
                  </ul>
                </Card>

                <Card className="space-y-4 p-5">
                  <fieldset>
                    <legend className="text-sm font-semibold text-white">Verdict</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {([["true_positive", "True positive: real issue"], ["false_positive", "False positive: expected activity"]] as const).map(([value, label]) => (
                        <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${draft.verdict === value ? "border-sky-400/60 bg-sky-400/10 text-sky-100" : "border-slate-700 text-slate-200"}`}>
                          <input type="radio" name={`verdict-${active.id}`} value={value} checked={draft.verdict === value} onChange={() => update({ verdict: value })} className="accent-sky-400" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {draft.verdict === "true_positive" ? (
                    <div className="space-y-2">
                      <label htmlFor={`severity-${active.id}`} className="text-sm font-semibold text-white">Your severity</label>
                      <Select id={`severity-${active.id}`} value={draft.severity ?? ""} onChange={(event) => update({ severity: event.target.value as AlertSeverity })} className="max-w-xs">
                        <option value="" disabled>Choose severity</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </Select>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <label htmlFor={`note-${active.id}`} className="text-sm font-semibold text-white">Case note for the next shift</label>
                    <p className="text-xs text-slate-400">Say what happened, the key evidence (IPs, hosts, tickets), and the next action. At least 20 characters.</p>
                    <Textarea id={`note-${active.id}`} value={draft.note} onChange={(event) => update({ note: event.target.value })} placeholder="e.g. Spray from 203.0.113.45 hit j.okafor (no MFA). Disable account and end session." />
                  </div>
                </Card>

                {submitError ? <ErrorMessage>{submitError}</ErrorMessage> : null}
                <div className="flex flex-wrap gap-2">
                  {shift.alerts.findIndex((alert) => alert.id === active.id) < shift.alerts.length - 1 ? (
                    <Button className="border border-slate-700 text-slate-100" onClick={() => setActiveId(shift.alerts[shift.alerts.findIndex((alert) => alert.id === active.id) + 1].id)}>Next alert</Button>
                  ) : null}
                  <Button className="bg-sky-400 text-slate-950" disabled={busy || done < shift.alerts.length} onClick={endShift}>
                    {busy ? "Scoring..." : done < shift.alerts.length ? `End shift (${shift.alerts.length - done} left)` : "End shift and see report"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
