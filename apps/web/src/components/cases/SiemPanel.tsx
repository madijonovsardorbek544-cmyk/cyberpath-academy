import { useMemo, useState } from "react";
import { parseSiemEvents, runSiemQuery, siemFieldSummary, type SiemResult } from "@cyberpath/contracts/siem";
import { Button, Input } from "../ui";
import type { CaseEvidence } from "../../types";

const MAX_ROWS = 200;
const examples = ["action=failure | stats count by user | sort -count", "sourcetype=proxy | stats count, dc(src_ip) by url_domain", "| sort -ts | head 20"];

const cell = (value: unknown) => (value === undefined || value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value));

/** Search JSON evidence the way a SOC analyst queries a SIEM, entirely in the browser. */
export function SiemPanel({ evidence }: { evidence: CaseEvidence[] }) {
  const sources = useMemo(() => evidence.flatMap((item) => {
    const events = item.kind === "json" ? parseSiemEvents(item.content) : null;
    return events ? [{ item, events, fields: siemFieldSummary(events) }] : [];
  }), [evidence]);
  const [sourceId, setSourceId] = useState(sources[0]?.item.id);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SiemResult | null>(null);
  const [error, setError] = useState("");
  const source = sources.find((entry) => entry.item.id === sourceId) ?? sources[0];

  if (!source) return <p className="mt-3 text-sm text-slate-400">SIEM mode works on JSON event files. This case has none, so use the viewer or the terminal.</p>;

  const run = (text = query) => {
    setQuery(text);
    try {
      setResult(runSiemQuery(source.events, text));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const shown = result ?? runSiemQuery(source.events, "");

  return (
    <div className="mt-3 space-y-3">
      {sources.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Event source">
          {sources.map(({ item }) => <button key={item.id} type="button" aria-pressed={item.id === source.item.id} onClick={() => { setSourceId(item.id); setResult(null); }} className={`rounded-xl border px-3 py-2 font-mono text-xs ${item.id === source.item.id ? "border-sky-400/60 bg-sky-400/10 text-sky-100" : "border-slate-700 text-slate-300"}`}>{item.name}</button>)}
        </div>
      ) : null}
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); run(); }}>
        <label htmlFor="siem-query" className="sr-only">SIEM query</label>
        <Input id="siem-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="field=value | stats count by field" className="font-mono text-xs" autoComplete="off" spellCheck={false} />
        <Button type="submit" className="shrink-0 bg-sky-400 text-slate-950">Search</Button>
      </form>
      <details className="text-xs text-slate-400">
        <summary className="cursor-pointer text-slate-300">How to search</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><code>field=value</code>, <code>field!=value</code>, <code>bytes_out&gt;1000</code>, <code>NOT field=value</code>, plain words, and <code>*</code> wildcards. Terms are combined with AND.</li>
          <li>Then pipe into <code>| stats count, dc(f), sum(f), min(f), max(f), values(f) by f1, f2</code>, <code>| sort -field</code>, <code>| head 10</code>, <code>| tail 10</code>, <code>| table f1, f2</code> or <code>| dedup field</code>.</li>
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((example) => <button key={example} type="button" onClick={() => run(example)} className="rounded-lg border border-slate-700 px-2 py-1 font-mono text-[11px] text-slate-300 hover:border-sky-400/40">{example}</button>)}
        </div>
      </details>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-1" aria-label="Fields">
        {source.fields.slice(0, 24).map(({ field, count }) => (
          <button key={field} type="button" title={`${count} events have ${field}. Click to count its values.`} onClick={() => run(`${query.split("|")[0].trim()} | stats count by ${field} | sort -count`.trim())} className="rounded-lg bg-slate-800/70 px-2 py-1 font-mono text-[11px] text-slate-300 hover:bg-slate-700">{field}</button>
        ))}
      </div>
      <p className="text-xs text-slate-400" aria-live="polite">{shown.total.toLocaleString()} {shown.isTable ? (shown.total === 1 ? "row" : "rows") : shown.total === 1 ? "event" : "events"}{shown.total > MAX_ROWS ? `, showing the first ${MAX_ROWS}` : ""}</p>
      <div className="relative max-h-[520px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950" tabIndex={0} aria-label="Search results">
        <table className="min-w-full text-left font-mono text-[11px] leading-5">
          <thead className="sticky top-0 bg-slate-900 text-slate-400">
            <tr>{shown.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-2 py-1 font-medium">{column}</th>)}</tr>
          </thead>
          <tbody className="text-slate-200">
            {shown.rows.slice(0, MAX_ROWS).map((row, index) => (
              <tr key={index} className="border-t border-slate-800/70 align-top">
                {shown.columns.map((column) => <td key={column} className="max-w-[28rem] whitespace-nowrap px-2 py-1" title={cell(row[column])}><span className="block truncate">{cell(row[column])}</span></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
