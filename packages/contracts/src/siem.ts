// A small SIEM-style search language that runs in the browser over JSON events.
// It is a teaching subset of what analysts type into Splunk or Elastic:
//   src_ip=198.51.100.* action=failure NOT user=svc-* | stats count, dc(user) by src_ip | sort -count | head 5
// Search terms are ANDed. Values may use * wildcards and "quotes". Commands: stats, sort, head, table, where-style
// comparisons with > >= < <= in the search, and dedup.

export type SiemEvent = Record<string, unknown>;
export type SiemResult = { columns: string[]; rows: SiemEvent[]; total: number; isTable: boolean };

export class SiemQueryError extends Error {}

/** Parses evidence text into events: a JSON array of objects, or one JSON object per line. Returns null otherwise. */
export function parseSiemEvents(content: string): SiemEvent[] | null {
  const text = content.trim();
  if (!text) return null;
  const isRecord = (value: unknown): value is SiemEvent => typeof value === 'object' && value !== null && !Array.isArray(value);
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length && parsed.every(isRecord)) return parsed.map((event) => flatten(event));
  } catch {
    // Not one JSON document, try JSON lines below.
  }
  const lines = text.split('\n').filter((line) => line.trim());
  const events: SiemEvent[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (!isRecord(parsed)) return null;
      events.push(flatten(parsed));
    } catch {
      return null;
    }
  }
  return events.length ? events : null;
}

/** Nested objects become dotted fields, e.g. userIdentity.userName, so they can be searched and grouped. */
function flatten(event: SiemEvent, prefix = '', out: SiemEvent = {}): SiemEvent {
  for (const [key, value] of Object.entries(event)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) flatten(value as SiemEvent, name, out);
    else out[name] = Array.isArray(value) ? JSON.stringify(value) : value;
  }
  return out;
}

function words(segment: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quoted = false;
  let hasToken = false;
  for (const char of segment) {
    if (char === '"') { quoted = !quoted; hasToken = true; continue; }
    if (!quoted && /\s|,/.test(char)) {
      if (hasToken) tokens.push(current);
      if (char === ',') tokens.push(',');
      current = '';
      hasToken = false;
      continue;
    }
    current += char;
    hasToken = true;
  }
  if (quoted) throw new SiemQueryError('A quote is not closed.');
  if (hasToken) tokens.push(current);
  return tokens;
}

function splitPipes(query: string) {
  const parts: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of query) {
    if (char === '"') quoted = !quoted;
    if (char === '|' && !quoted) { parts.push(current); current = ''; continue; }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

const wildcard = (pattern: string) => new RegExp(`^${pattern.split('*').map((piece) => piece.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`, 'i');
const text = (value: unknown) => (value === undefined || value === null ? '' : String(value));

type Predicate = (event: SiemEvent) => boolean;

function termPredicate(token: string): Predicate {
  const match = token.match(/^([\w.@-]+)(!=|>=|<=|=|>|<)(.*)$/);
  if (!match) {
    const needle = token.toLowerCase();
    const pattern = needle.includes('*') ? wildcard(needle) : null;
    return (event) => Object.values(event).some((value) => (pattern ? pattern.test(text(value)) : text(value).toLowerCase().includes(needle)));
  }
  const [, field, op, raw] = match;
  if (op === '=' || op === '!=') {
    const pattern = wildcard(raw);
    return op === '=' ? (event) => pattern.test(text(event[field])) : (event) => !pattern.test(text(event[field]));
  }
  const limit = Number(raw);
  if (Number.isNaN(limit)) throw new SiemQueryError(`${field}${op}${raw}: compare with a number, for example bytes_out>100000.`);
  return (event) => {
    const value = Number(event[field]);
    if (event[field] === undefined || Number.isNaN(value)) return false;
    return op === '>' ? value > limit : op === '>=' ? value >= limit : op === '<' ? value < limit : value <= limit;
  };
}

function search(events: SiemEvent[], segment: string): SiemEvent[] {
  const tokens = words(segment).filter((token) => token !== ',');
  const predicates: Predicate[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === 'AND') continue;
    if (token === 'NOT') {
      if (!tokens[i + 1]) throw new SiemQueryError('NOT needs a term after it.');
      const inner = termPredicate(tokens[++i]);
      predicates.push((event) => !inner(event));
      continue;
    }
    if (token === 'OR') throw new SiemQueryError('OR is not supported here. Run two searches, or use a * wildcard.');
    predicates.push(termPredicate(token));
  }
  return predicates.length ? events.filter((event) => predicates.every((predicate) => predicate(event))) : events;
}

type Aggregate = { name: string; fn: 'count' | 'dc' | 'sum' | 'min' | 'max' | 'values'; field?: string };

function stats(rows: SiemEvent[], tokens: string[]): { rows: SiemEvent[]; columns: string[] } {
  const byIndex = tokens.indexOf('by');
  const aggTokens = (byIndex === -1 ? tokens : tokens.slice(0, byIndex)).filter((token) => token !== ',');
  const groupBy = byIndex === -1 ? [] : tokens.slice(byIndex + 1).filter((token) => token !== ',');
  if (byIndex !== -1 && !groupBy.length) throw new SiemQueryError('stats ... by needs at least one field.');
  const aggregates: Aggregate[] = aggTokens.map((token) => {
    if (token === 'count') return { name: 'count', fn: 'count' };
    const match = token.match(/^(dc|sum|min|max|values)\(([\w.@-]+)\)$/);
    if (!match) throw new SiemQueryError(`Unknown stats function "${token}". Use count, dc(field), sum(field), min(field), max(field) or values(field).`);
    return { name: token, fn: match[1] as Aggregate['fn'], field: match[2] };
  });
  if (!aggregates.length) throw new SiemQueryError('stats needs a function, for example: stats count by src_ip');

  const groups = new Map<string, SiemEvent[]>();
  for (const row of rows) {
    if (groupBy.some((field) => row[field] === undefined)) continue;
    const key = JSON.stringify(groupBy.map((field) => text(row[field])));
    const members = groups.get(key);
    if (members) members.push(row);
    else groups.set(key, [row]);
  }
  if (!groupBy.length) groups.set('[]', rows);
  const result = [...groups.entries()].map(([key, members]) => {
    const out: SiemEvent = {};
    (JSON.parse(key) as string[]).forEach((value, index) => { out[groupBy[index]] = value; });
    for (const aggregate of aggregates) {
      const values = aggregate.field ? members.map((member) => member[aggregate.field!]).filter((value) => value !== undefined) : [];
      const numbers = values.map(Number).filter((value) => !Number.isNaN(value));
      out[aggregate.name] = aggregate.fn === 'count' ? members.length
        : aggregate.fn === 'dc' ? new Set(values.map(text)).size
        : aggregate.fn === 'sum' ? numbers.reduce((sum, value) => sum + value, 0)
        : aggregate.fn === 'min' ? (numbers.length ? Math.min(...numbers) : null)
        : aggregate.fn === 'max' ? (numbers.length ? Math.max(...numbers) : null)
        : [...new Set(values.map(text))].sort().slice(0, 20).join(', ');
    }
    return out;
  });
  return { rows: result, columns: [...groupBy, ...aggregates.map((aggregate) => aggregate.name)] };
}

function compare(a: unknown, b: unknown) {
  const left = Number(a);
  const right = Number(b);
  if (a !== '' && b !== '' && !Number.isNaN(left) && !Number.isNaN(right) && a !== null && b !== null) return left - right;
  return text(a).localeCompare(text(b));
}

/** Runs a query. Throws SiemQueryError with a learner-friendly message when the query is wrong. */
export function runSiemQuery(events: SiemEvent[], query: string): SiemResult {
  const [first, ...commands] = splitPipes(query);
  let rows = search(events, first);
  let columns: string[] | null = null;
  let isTable = false;

  for (const command of commands) {
    const [name, ...rest] = words(command);
    if (!name) throw new SiemQueryError('There is an empty step between two | pipes.');
    if (name === 'search') rows = search(rows, command.slice('search'.length));
    else if (name === 'stats') {
      ({ rows, columns } = stats(rows, rest));
      isTable = true;
    } else if (name === 'sort') {
      const keys = rest.filter((token) => token !== ',').map((token) => ({ field: token.replace(/^[-+]/, ''), desc: token.startsWith('-') }));
      if (!keys.length) throw new SiemQueryError('sort needs a field. Use -field for largest first.');
      rows = [...rows].sort((a, b) => {
        for (const key of keys) {
          const order = compare(a[key.field], b[key.field]);
          if (order) return key.desc ? -order : order;
        }
        return 0;
      });
    } else if (name === 'head' || name === 'tail') {
      const count = rest.length ? Number(rest[0]) : 10;
      if (!Number.isInteger(count) || count < 0) throw new SiemQueryError(`${name} needs a whole number, for example ${name} 10.`);
      rows = name === 'head' ? rows.slice(0, count) : rows.slice(Math.max(0, rows.length - count));
    } else if (name === 'table') {
      columns = rest.filter((token) => token !== ',');
      if (!columns.length) throw new SiemQueryError('table needs at least one field.');
      const fields = columns;
      rows = rows.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
      isTable = true;
    } else if (name === 'dedup') {
      const fields = rest.filter((token) => token !== ',');
      if (!fields.length) throw new SiemQueryError('dedup needs at least one field.');
      const seen = new Set<string>();
      rows = rows.filter((row) => {
        const key = JSON.stringify(fields.map((field) => text(row[field])));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else throw new SiemQueryError(`Unknown command "${name}". Try stats, sort, head, tail, table or dedup.`);
  }

  if (!columns) {
    const seen = new Set<string>();
    for (const row of rows.slice(0, 200)) Object.keys(row).forEach((key) => seen.add(key));
    columns = [...seen];
  }
  return { columns, rows, total: rows.length, isTable };
}

/** The distinct fields in a dataset with how many events have each one, for the field sidebar. */
export function siemFieldSummary(events: SiemEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) for (const key of Object.keys(event)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts.entries()].map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));
}
