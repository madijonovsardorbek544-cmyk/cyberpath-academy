// A small, read-only POSIX-style shell that runs entirely in the browser over an in-memory file tree.
// It supports pipes and the text tools analysts use on logs: grep, awk, cut, sort, uniq, wc, head, tail,
// find, base64 and iconv. Nothing here touches the network or the real machine.

export type ShellDir = { [name: string]: string | ShellDir };
export type ShellContext = { fs: ShellDir; cwd: string; home: string };
export type ShellResult = { output: string; cwd: string; clear?: boolean };

class ShellError extends Error {}

export function tokenize(line: string): string[][] {
  const commands: string[][] = [[]];
  let current = '';
  let quote: '"' | "'" | null = null;
  let hasToken = false;
  const push = () => {
    if (hasToken) commands[commands.length - 1].push(current);
    current = '';
    hasToken = false;
  };
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quote) {
      if (char === quote) quote = null;
      else if (char === '\\' && quote === '"' && (line[i + 1] === '"' || line[i + 1] === '\\')) current += line[++i];
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; hasToken = true; continue; }
    if (char === '\\' && i + 1 < line.length) { current += line[++i]; hasToken = true; continue; }
    if (char === '|') { push(); commands.push([]); continue; }
    if (/\s/.test(char)) { push(); continue; }
    current += char;
    hasToken = true;
  }
  if (quote) throw new ShellError('unexpected end of input: missing closing quote');
  push();
  return commands;
}

function resolvePath(ctx: ShellContext, path: string) {
  const raw = path === '~' || path.startsWith('~/') ? ctx.home + path.slice(1) : path;
  const parts = (raw.startsWith('/') ? raw : `${ctx.cwd}/${raw}`).split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return `/${stack.join('/')}`;
}

function lookup(ctx: ShellContext, path: string): string | ShellDir | undefined {
  let node: string | ShellDir = ctx.fs;
  for (const part of resolvePath(ctx, path).split('/').filter(Boolean)) {
    if (typeof node === 'string' || !(part in node)) return undefined;
    node = node[part];
  }
  return node;
}

function readFile(ctx: ShellContext, cmd: string, path: string) {
  const node = lookup(ctx, path);
  if (node === undefined) throw new ShellError(`${cmd}: ${path}: No such file or directory`);
  if (typeof node !== 'string') throw new ShellError(`${cmd}: ${path}: Is a directory`);
  return node;
}

/** Input text for filters: named files, or stdin when none are given. */
function inputOf(ctx: ShellContext, cmd: string, files: string[], stdin: string | null) {
  if (files.length) return files.map((file) => readFile(ctx, cmd, file)).join('');
  if (stdin === null) throw new ShellError(`${cmd}: missing file operand`);
  return stdin;
}

function lines(text: string) {
  const all = text.split('\n');
  if (all.length && all[all.length - 1] === '') all.pop();
  return all;
}

function joinLines(items: string[]) {
  return items.length ? `${items.join('\n')}\n` : '';
}

/** Splits flags like -inv into separate letters and pulls values for flags that take one. */
function parseFlags(args: string[], withValue: string[] = []) {
  const flags = new Map<string, string | true>();
  const rest: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--') { rest.push(...args.slice(i + 1)); break; }
    if (/^-\d+$/.test(arg)) { flags.set('n', arg.slice(1)); continue; }
    if (arg.startsWith('-') && arg.length > 1) {
      for (let j = 1; j < arg.length; j += 1) {
        const flag = arg[j];
        if (withValue.includes(flag)) {
          const value = arg.slice(j + 1) || args[++i];
          if (value === undefined) throw new ShellError(`option requires an argument -- '${flag}'`);
          flags.set(flag, value);
          break;
        }
        flags.set(flag, true);
      }
      continue;
    }
    rest.push(arg);
  }
  return { flags, rest };
}

function globToRegExp(glob: string) {
  return new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
}

function count(n: string | true | undefined, fallback: number) {
  if (n === undefined || n === true) return fallback;
  const value = Number(n);
  if (!Number.isInteger(value) || value < 0) throw new ShellError(`invalid number of lines: '${n}'`);
  return value;
}

function fieldList(spec: string) {
  const fields = new Set<number>();
  for (const part of spec.split(',')) {
    const [from, to] = part.split('-');
    const start = Number(from || 1);
    const end = part.includes('-') ? Number(to || 1000) : start;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1) throw new ShellError(`cut: invalid field list '${spec}'`);
    for (let i = start; i <= end; i += 1) fields.add(i);
  }
  return [...fields].sort((a, b) => a - b);
}

function runAwk(program: string, text: string, separator: string | null) {
  const match = program.trim().match(/^(?:\/((?:\\\/|[^/])*)\/\s*)?(?:\{\s*print\s*([^}]*)\})?$/);
  if (!match || (!match[1] && match[2] === undefined)) throw new ShellError("awk: only '/regex/ { print $1, $2 }' style programs are supported here");
  const filter = match[1] ? new RegExp(match[1].replace(/\\\//g, '/')) : null;
  const expressions = (match[2] ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  return joinLines(lines(text).filter((line) => !filter || filter.test(line)).map((line) => {
    const fields = separator ? line.split(separator) : line.trim().split(/\s+/);
    if (!expressions.length) return line;
    return expressions.map((expression) => {
      if (expression === '$0') return line;
      if (expression === 'NF') return String(fields.length);
      if (expression === '$NF') return fields[fields.length - 1] ?? '';
      const field = expression.match(/^\$(\d+)$/);
      if (field) return fields[Number(field[1]) - 1] ?? '';
      const literal = expression.match(/^"(.*)"$/);
      if (literal) return literal[1];
      throw new ShellError(`awk: unsupported expression '${expression}'`);
    }).join(' ');
  }));
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes to a byte string (one char per byte), like piping `base64 -d` output. */
function decodeBase64(text: string) {
  const clean = text.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) throw new ShellError('base64: invalid input');
  let bits = 0;
  let value = 0;
  let out = '';
  for (const char of clean.replace(/=+$/, '')) {
    value = (value << 6) | BASE64.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((value >> bits) & 0xff);
    }
  }
  return out;
}

function decodeUtf16le(binary: string) {
  let out = '';
  for (let i = 0; i + 1 < binary.length; i += 2) out += String.fromCharCode(binary.charCodeAt(i) | (binary.charCodeAt(i + 1) << 8));
  return out;
}

const HELP = `Read-only analyst shell. Pipes (|) work between commands.
  ls [-l] [path]         list files            cd <dir> / pwd       move around
  cat <file...>          print files           head / tail [-n N]   first / last lines
  grep [-ivcnoE] pat     search lines          wc [-lwc]            count lines/words/bytes
  sort [-rnu] [-t c -k N] sort lines           uniq [-c] [-d]       collapse repeats
  cut -d c -f 1,3        pick columns          awk '{print $1, $3}' print fields (supports /re/ filter, -F)
  find [dir] -name '*.log'  find files         base64 -d            decode base64
  iconv -f utf-16le      convert UTF-16LE      echo / clear / help
Example: grep FAIL vpn-gw01.log | awk '{print $6}' | sort | uniq -c`;

function runCommand(ctx: ShellContext, argv: string[], stdin: string | null): ShellResult {
  const [cmd, ...args] = argv;
  const ok = (output: string) => ({ output, cwd: ctx.cwd });
  switch (cmd) {
    case 'help': return ok(`${HELP}\n`);
    case 'clear': return { output: '', cwd: ctx.cwd, clear: true };
    case 'pwd': return ok(`${ctx.cwd}\n`);
    case 'echo': return ok(`${args.join(' ')}\n`);
    case 'whoami': return ok('analyst\n');
    case 'cd': {
      const target = resolvePath(ctx, args[0] ?? ctx.home);
      const node = lookup(ctx, target);
      if (node === undefined) throw new ShellError(`cd: ${args[0]}: No such file or directory`);
      if (typeof node === 'string') throw new ShellError(`cd: ${args[0]}: Not a directory`);
      return { output: '', cwd: target };
    }
    case 'ls': {
      const { flags, rest } = parseFlags(args);
      const targets = rest.length ? rest : ['.'];
      const blocks = targets.map((target) => {
        const node = lookup(ctx, target);
        if (node === undefined) throw new ShellError(`ls: cannot access '${target}': No such file or directory`);
        if (typeof node === 'string') return flags.has('l') ? `-r--r--r-- ${String(node.length).padStart(8)} ${target}` : target;
        const names = Object.keys(node).sort();
        const shown = names.map((name) => {
          const child = node[name];
          const label = typeof child === 'string' ? name : `${name}/`;
          return flags.has('l') ? `${typeof child === 'string' ? '-r--r--r--' : 'dr-xr-xr-x'} ${String(typeof child === 'string' ? child.length : Object.keys(child).length).padStart(8)} ${label}` : label;
        });
        return `${targets.length > 1 ? `${target}:\n` : ''}${shown.join(flags.has('l') ? '\n' : '  ')}`;
      });
      return ok(joinLines(blocks.filter(Boolean)));
    }
    case 'cat': return ok(inputOf(ctx, cmd, args, stdin));
    case 'head':
    case 'tail': {
      const { flags, rest } = parseFlags(args, ['n']);
      const n = count(flags.get('n'), 10);
      const all = lines(inputOf(ctx, cmd, rest, stdin));
      return ok(joinLines(cmd === 'head' ? all.slice(0, n) : all.slice(Math.max(0, all.length - n))));
    }
    case 'grep': {
      const { flags, rest } = parseFlags(args, ['e']);
      const pattern = (flags.get('e') as string | undefined) ?? rest.shift();
      if (pattern === undefined) throw new ShellError('usage: grep [-ivcnoEF] PATTERN [FILE...]');
      let regex: RegExp;
      try {
        const source = flags.has('F') ? pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : pattern;
        regex = new RegExp(source, flags.has('i') ? 'gi' : 'g');
      } catch {
        throw new ShellError(`grep: invalid regular expression '${pattern}'`);
      }
      const files = rest.length ? rest : [null];
      const out: string[] = [];
      for (const file of files) {
        const text = file === null ? inputOf(ctx, cmd, [], stdin) : readFile(ctx, cmd, file);
        const prefix = files.length > 1 && file ? `${file}:` : '';
        let matches = 0;
        lines(text).forEach((line, index) => {
          regex.lastIndex = 0;
          const hit = regex.test(line);
          if (hit === flags.has('v')) return;
          matches += 1;
          if (flags.has('c')) return;
          if (flags.has('o') && !flags.has('v')) {
            for (const found of line.matchAll(new RegExp(regex.source, regex.flags))) out.push(`${prefix}${found[0]}`);
            return;
          }
          out.push(`${prefix}${flags.has('n') ? `${index + 1}:` : ''}${line}`);
        });
        if (flags.has('c')) out.push(`${prefix}${matches}`);
      }
      return ok(joinLines(out));
    }
    case 'wc': {
      const { flags, rest } = parseFlags(args);
      const text = inputOf(ctx, cmd, rest, stdin);
      const values = { l: (text.match(/\n/g) ?? []).length, w: text.split(/\s+/).filter(Boolean).length, c: text.length };
      const chosen = (['l', 'w', 'c'] as const).filter((flag) => flags.has(flag));
      return ok(`${(chosen.length ? chosen : (['l', 'w', 'c'] as const)).map((flag) => values[flag]).join(' ')}${rest.length === 1 ? ` ${rest[0]}` : ''}\n`);
    }
    case 'sort': {
      const { flags, rest } = parseFlags(args, ['t', 'k']);
      const separator = flags.get('t') as string | undefined;
      const key = flags.has('k') ? Number(String(flags.get('k')).split(',')[0]) : 0;
      const keyOf = (line: string) => key ? ((separator ? line.split(separator) : line.trim().split(/\s+/))[key - 1] ?? '') : line;
      let sorted = [...lines(inputOf(ctx, cmd, rest, stdin))].sort((a, b) => {
        const left = keyOf(a);
        const right = keyOf(b);
        if (flags.has('n')) return (parseFloat(left) || 0) - (parseFloat(right) || 0) || a.localeCompare(b);
        return left < right ? -1 : left > right ? 1 : 0;
      });
      if (flags.has('r')) sorted.reverse();
      if (flags.has('u')) sorted = sorted.filter((line, index) => index === 0 || keyOf(line) !== keyOf(sorted[index - 1]));
      return ok(joinLines(sorted));
    }
    case 'uniq': {
      const { flags, rest } = parseFlags(args);
      const groups: Array<{ line: string; n: number }> = [];
      for (const line of lines(inputOf(ctx, cmd, rest, stdin))) {
        const last = groups[groups.length - 1];
        if (last && last.line === line) last.n += 1;
        else groups.push({ line, n: 1 });
      }
      return ok(joinLines(groups.filter((group) => !flags.has('d') || group.n > 1).map((group) => flags.has('c') ? `${String(group.n).padStart(7)} ${group.line}` : group.line)));
    }
    case 'cut': {
      const { flags, rest } = parseFlags(args, ['d', 'f']);
      if (!flags.has('f')) throw new ShellError('cut: you must specify a list of fields with -f');
      const separator = (flags.get('d') as string | undefined) ?? '\t';
      const fields = fieldList(String(flags.get('f')));
      return ok(joinLines(lines(inputOf(ctx, cmd, rest, stdin)).map((line) => {
        if (!line.includes(separator)) return line;
        const parts = line.split(separator);
        return fields.filter((field) => field <= parts.length).map((field) => parts[field - 1]).join(separator);
      })));
    }
    case 'awk': {
      const { flags, rest } = parseFlags(args, ['F']);
      const program = rest.shift();
      if (!program) throw new ShellError("usage: awk [-F sep] '{print $1}' [file]");
      return ok(runAwk(program, inputOf(ctx, cmd, rest, stdin), (flags.get('F') as string | undefined) ?? null));
    }
    case 'find': {
      const start = args[0] && !args[0].startsWith('-') ? args[0] : '.';
      const options = args[0] && !args[0].startsWith('-') ? args.slice(1) : args;
      let name: RegExp | null = null;
      let type: string | null = null;
      for (let i = 0; i < options.length; i += 2) {
        if (options[i] === '-name' || options[i] === '-iname') name = new RegExp(globToRegExp(options[i + 1] ?? '*').source, options[i] === '-iname' ? 'i' : '');
        else if (options[i] === '-type') type = options[i + 1] ?? null;
        else throw new ShellError(`find: unknown predicate '${options[i]}'`);
      }
      const root = lookup(ctx, start);
      if (root === undefined) throw new ShellError(`find: '${start}': No such file or directory`);
      const out: string[] = [];
      const walk = (node: string | ShellDir, path: string, base: string) => {
        const isDir = typeof node !== 'string';
        if ((!name || name.test(base)) && (!type || (type === 'd') === isDir)) out.push(path);
        if (isDir) for (const child of Object.keys(node).sort()) walk(node[child], `${path.replace(/\/$/, '')}/${child}`, child);
      };
      walk(root, start, start.split('/').filter(Boolean).pop() ?? start);
      return ok(joinLines(out));
    }
    case 'base64': {
      const { flags, rest } = parseFlags(args);
      if (!flags.has('d')) throw new ShellError('base64: only decoding (-d) is supported here');
      return ok(decodeBase64(inputOf(ctx, cmd, rest, stdin)));
    }
    case 'iconv': {
      const { flags, rest } = parseFlags(args, ['f', 't']);
      const from = String(flags.get('f') ?? '').toLowerCase().replace(/_/g, '-');
      const text = inputOf(ctx, cmd, rest, stdin);
      if (from === 'utf-16le' || from === 'utf16le') return ok(`${decodeUtf16le(text)}\n`);
      if (from === 'utf-8' || from === 'utf8' || from === '') return ok(text);
      throw new ShellError(`iconv: conversion from '${from}' is not supported here (try utf-16le)`);
    }
    default:
      throw new ShellError(`${cmd}: command not found. Type 'help' to list commands.`);
  }
}

/** Runs one command line (with pipes). Errors are returned as output, like a real shell. */
export function runShell(line: string, ctx: ShellContext): ShellResult {
  try {
    const pipeline = tokenize(line);
    if (pipeline.length === 1 && pipeline[0].length === 0) return { output: '', cwd: ctx.cwd };
    if (pipeline.some((argv) => argv.length === 0)) throw new ShellError('syntax error near unexpected token `|\'');
    let stdin: string | null = null;
    let cwd = ctx.cwd;
    let clear = false;
    for (const argv of pipeline) {
      const result = runCommand({ ...ctx, cwd }, argv, stdin);
      stdin = result.output;
      cwd = result.cwd;
      clear = clear || Boolean(result.clear);
    }
    return { output: stdin ?? '', cwd, clear };
  } catch (error) {
    if (error instanceof ShellError) return { output: `${error.message}\n`, cwd: ctx.cwd };
    throw error;
  }
}

/** Commands the shell knows, for tab completion and for callers that layer extra commands on top. */
export const shellCommands = ['awk', 'base64', 'cat', 'cd', 'clear', 'cut', 'echo', 'find', 'grep', 'head', 'help', 'iconv', 'ls', 'pwd', 'sort', 'tail', 'uniq', 'wc', 'whoami'];
