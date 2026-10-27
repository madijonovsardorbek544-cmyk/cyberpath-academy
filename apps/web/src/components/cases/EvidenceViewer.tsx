import { lazy, Suspense, useMemo, useState } from "react";
import { Card, Input, Loader } from "../ui";
import type { CaseEvidence } from "../../types";

const SiemPanel = lazy(() => import("./SiemPanel").then((module) => ({ default: module.SiemPanel })));
const ShellTerminal = lazy(() => import("../terminal/ShellTerminal").then((module) => ({ default: module.ShellTerminal })));
const terminalBanner = ["Read-only analyst shell. Evidence files are in this folder.", "Try: ls, then grep, awk, sort | uniq -c. Type help for all commands."];

/** Evidence files with search and a read-only analyst terminal over the same files. */
export function EvidenceViewer({ evidence }: { evidence: CaseEvidence[] }) {
  const [activeId, setActiveId] = useState(evidence[0]?.id);
  const [query, setQuery] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const hasEvents = evidence.some((item) => item.kind === "json");
  const modes = hasEvents ? (["viewer", "terminal", "siem"] as const) : (["viewer", "terminal"] as const);
  const [mode, setMode] = useState<(typeof modes)[number]>("viewer");
  const active = evidence.find((item) => item.id === activeId) ?? evidence[0];
  const caseFs = useMemo(() => ({ case: Object.fromEntries(evidence.map((item) => [item.name, item.content])) }), [evidence]);

  const lines = useMemo(() => active.content.split("\n").map((text, index) => ({ number: index + 1, text })), [active]);
  const needle = query.trim().toLowerCase();
  const matches = needle ? lines.filter((line) => line.text.toLowerCase().includes(needle)) : [];
  const shown = needle && onlyMatches ? matches : lines;

  return (
    <Card className="min-w-0 p-5 xl:sticky xl:top-28 xl:self-start">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">Evidence</h2>
        <div className="flex rounded-2xl border border-slate-700 p-1 text-sm" role="group" aria-label="Evidence tool">
          {modes.map((option) => (
            <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)} className={`rounded-xl px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${mode === option ? "bg-sky-400 text-slate-950" : "text-slate-300"}`}>{option === "siem" ? "SIEM" : option === "viewer" ? "Viewer" : "Terminal"}</button>
          ))}
        </div>
      </div>
      {mode === "siem" ? (
        <Suspense fallback={<Loader text="Loading SIEM..." />}>
          <SiemPanel evidence={evidence} />
        </Suspense>
      ) : mode === "terminal" ? (
        <div className="mt-3">
          <Suspense fallback={<Loader text="Starting terminal..." />}>
            <ShellTerminal fs={caseFs} home="/case" banner={terminalBanner} label="Evidence terminal" />
          </Suspense>
        </div>
      ) : (<>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Evidence files">
        {evidence.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === active.id}
            onClick={() => setActiveId(item.id)}
            className={`rounded-xl border px-3 py-2 font-mono text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${item.id === active.id ? "border-sky-400/60 bg-sky-400/10 text-sky-100" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-400">{active.description}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="evidence-search" className="sr-only">Search this file</label>
        <Input id="evidence-search" placeholder="Search this file, e.g. 203.0.113.45" value={query} onChange={(event) => setQuery(event.target.value)} className="font-mono" />
        <label className="flex shrink-0 items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={onlyMatches} onChange={(event) => setOnlyMatches(event.target.checked)} className="h-4 w-4 accent-sky-400" />
          Only matching lines
        </label>
      </div>
      {needle ? <p className="mt-2 text-xs text-slate-400" aria-live="polite">{matches.length} matching {matches.length === 1 ? "line" : "lines"}</p> : null}
      <div className="mt-3 max-h-[560px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-3" tabIndex={0} aria-label={`${active.name} contents`}>
        <pre className="font-mono text-xs leading-6 text-slate-200">
          {shown.map((line) => {
            const hit = needle && line.text.toLowerCase().includes(needle);
            return (
              <div key={line.number} className={hit ? "bg-amber-300/15" : undefined}>
                <span className="mr-3 inline-block w-8 select-none text-right text-slate-600">{line.number}</span>
                {line.text}
              </div>
            );
          })}
        </pre>
      </div>
      </>)}
    </Card>
  );
}
