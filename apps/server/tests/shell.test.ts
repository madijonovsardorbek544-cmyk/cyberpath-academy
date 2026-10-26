import test from 'node:test';
import assert from 'node:assert/strict';
import { runShell, tokenize, type ShellContext } from '@cyberpath/contracts/shell';
import { findInvestigationCase } from '@cyberpath/contracts/cases';

function caseShell(slug: string): ShellContext {
  const item = findInvestigationCase(slug)!;
  return { fs: { case: Object.fromEntries(item.evidence.map((evidence) => [evidence.name, evidence.content])), notes: { 'readme.txt': 'hello\nworld\n' } }, cwd: '/case', home: '/case' };
}
const sh = (ctx: ShellContext, line: string) => runShell(line, ctx).output;

test('tokenizer handles quotes, escapes and pipes', () => {
  assert.deepEqual(tokenize(`grep "a | b" file | wc -l`), [['grep', 'a | b', 'file'], ['wc', '-l']]);
  assert.deepEqual(tokenize(`awk '{print $1}' x`), [['awk', '{print $1}', 'x']]);
  assert.deepEqual(tokenize(`echo a\\ b ""`), [['echo', 'a b', '']]);
});

test('navigation and listing work like a shell', () => {
  const ctx = caseShell('vpn-password-spray');
  assert.equal(sh(ctx, 'pwd'), '/case\n');
  assert.equal(sh(ctx, 'ls'), 'directory-export.csv  vpn-gw01.log\n');
  const moved = runShell('cd ../notes', ctx);
  assert.equal(moved.cwd, '/notes');
  assert.equal(sh({ ...ctx, cwd: moved.cwd }, 'cat readme.txt'), 'hello\nworld\n');
  assert.equal(sh(ctx, 'cat missing.log'), 'cat: missing.log: No such file or directory\n');
  assert.equal(sh(ctx, 'cd vpn-gw01.log'), 'cd: vpn-gw01.log: Not a directory\n');
  assert.equal(sh(ctx, 'find / -name "*.csv"'), '/case/directory-export.csv\n');
});

test('the spray case can be solved with a classic pipeline', () => {
  const ctx = caseShell('vpn-password-spray');
  const accounts = sh(ctx, `grep 'src=203.0.113.45' vpn-gw01.log | grep auth: | awk '{print $5}' | sort -u | wc -l`);
  assert.equal(accounts.trim(), '9');
  const top = sh(ctx, `grep FAIL vpn-gw01.log | awk '{print $6}' | sort | uniq -c | sort -rn | head -n 1`);
  assert.match(top, /^\s+8 src=203\.0\.113\.45\n$/);
  assert.equal(sh(ctx, 'grep -c SUCCESS vpn-gw01.log'), '4\n');
  assert.equal(sh(ctx, `grep -i 'J.OKAFOR' directory-export.csv | cut -d , -f 3`), 'not_enrolled\n');
});

test('base64 and iconv decode the encoded PowerShell command', () => {
  const ctx = caseShell('macro-powershell-persistence');
  const decoded = sh(ctx, `grep -o 'Enc [A-Za-z0-9+/=]*' ws-fin-07-sysmon.json | cut -d ' ' -f 2 | base64 -d | iconv -f utf-16le`);
  assert.match(decoded, /https:\/\/198\.51\.100\.23\/odupd\.exe/);
});

test('the upload case byte total can be pulled out with awk', () => {
  const ctx = caseShell('night-time-upload');
  const sizes = sh(ctx, `grep 203.0.113.80 conn.log | awk '{print $10}'`).trim().split('\n').map(Number);
  assert.equal(sizes.reduce((a, b) => a + b, 0), 754974720);
});

test('head, tail, grep flags, uniq -d and errors behave', () => {
  const ctx: ShellContext = { fs: { f: 'b\na\na\nc\n' }, cwd: '/', home: '/' };
  assert.equal(sh(ctx, 'head -n 2 f'), 'b\na\n');
  assert.equal(sh(ctx, 'tail -1 f'), 'c\n');
  assert.equal(sh(ctx, 'grep -v a f'), 'b\nc\n');
  assert.equal(sh(ctx, 'grep -n c f'), '4:c\n');
  assert.equal(sh(ctx, 'cat f | uniq -d'), 'a\n');
  assert.equal(sh(ctx, 'sort -r f'), 'c\nb\na\na\n');
  assert.equal(sh(ctx, 'grep "(" f'), "grep: invalid regular expression '('\n");
  assert.equal(sh(ctx, 'rm f'), "rm: command not found. Type 'help' to list commands.\n");
  assert.equal(sh(ctx, 'cat f |'), 'syntax error near unexpected token `|\'\n');
  assert.equal(sh(ctx, 'echo "unterminated'), 'unexpected end of input: missing closing quote\n');
  assert.equal(sh(ctx, "awk '{system(\"x\")}' f").startsWith('awk:'), true);
  assert.equal(runShell('clear', ctx).clear, true);
});
