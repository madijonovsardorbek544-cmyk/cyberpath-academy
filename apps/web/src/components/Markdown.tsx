import type { ReactNode } from 'react';

// Small, safe Markdown subset for lesson text: headings, paragraphs, lists, tables, quotes, code, bold, links.
// Builds React elements only (no innerHTML). shortcut: no nesting or images; add a real parser if lessons need them.

function inline(text: string, key = ''): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const k = `${key}-${index}`;
    if (token.startsWith('**')) parts.push(<strong key={k} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    else if (token.startsWith('`')) parts.push(<code key={k} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-200">{token.slice(1, -1)}</code>);
    else {
      const link = token.match(/^\[([^\]]+)\]\((.+)\)$/);
      const href = link ? link[2] : token;
      parts.push(<a key={k} href={href} target="_blank" rel="noreferrer noopener" className="break-words text-sky-300 underline underline-offset-2">{link ? link[1] : token}</a>);
    }
    last = index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    if (!line.trim()) { i += 1; continue; }

    if (line.startsWith('```')) {
      const code: string[] = [];
      for (i += 1; i < lines.length && !lines[i].startsWith('```'); i += 1) code.push(lines[i]);
      i += 1;
      blocks.push(<pre key={key} className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-emerald-200"><code>{code.join('\n')}</code></pre>);
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      const Tag = heading[1].length === 2 ? 'h2' : 'h3';
      blocks.push(<Tag key={key} className={Tag === 'h2' ? 'pt-4 text-xl font-semibold text-white' : 'pt-2 text-lg font-semibold text-white'}>{inline(heading[2], key)}</Tag>);
      i += 1;
      continue;
    }

    if (line.trim().startsWith('|') && lines[i + 1]?.trim().match(/^\|[\s|:-]+\|$/)) {
      const head = cells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trim().startsWith('|'); i += 1) rows.push(cells(lines[i]));
      blocks.push(
        <div key={key} className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-900 text-slate-200"><tr>{head.map((cell, c) => <th key={c} scope="col" className="px-3 py-2 font-semibold">{inline(cell, `${key}h${c}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, r) => <tr key={r} className="border-t border-slate-800 text-slate-300">{row.map((cell, c) => <td key={c} className="px-3 py-2 align-top">{inline(cell, `${key}${r}${c}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith('>')) {
      const quote: string[] = [];
      for (; i < lines.length && lines[i].startsWith('>'); i += 1) quote.push(lines[i].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key} className="rounded-2xl border-l-4 border-sky-400 bg-sky-400/5 px-4 py-3 text-slate-200">{inline(quote.join(' '), key)}</blockquote>);
      continue;
    }

    const listItem = /^\s*(?:[-*]|\d+\.)\s+/;
    if (listItem.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      for (; i < lines.length && (listItem.test(lines[i]) || (lines[i].startsWith('   ') && lines[i].trim())); i += 1) {
        if (listItem.test(lines[i])) items.push(lines[i].replace(listItem, ''));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(<List key={key} className={`space-y-1.5 pl-6 text-slate-300 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-slate-500`}>{items.map((item, n) => <li key={n}>{inline(item, `${key}${n}`)}</li>)}</List>);
      continue;
    }

    const paragraph: string[] = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{2,4}\s|```|>|\s*(?:[-*]|\d+\.)\s|\|)/.test(lines[i]); i += 1) paragraph.push(lines[i].trim());
    if (!paragraph.length) { paragraph.push(line.trim()); i += 1; }
    blocks.push(<p key={key} className="text-slate-300">{inline(paragraph.join(' '), key)}</p>);
  }

  return <div className="space-y-4 text-[15px] leading-7">{blocks}</div>;
}
