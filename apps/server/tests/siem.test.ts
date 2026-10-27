import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSiemEvents, runSiemQuery, SiemQueryError } from '@cyberpath/contracts/siem';
import { findInvestigationCase } from '@cyberpath/contracts/cases';

const sample = [
  { ts: '2026-01-01T00:00:01Z', user: 'a', src_ip: '10.0.0.1', action: 'failure', bytes: 10, geo: { country: 'UZ' } },
  { ts: '2026-01-01T00:00:02Z', user: 'b', src_ip: '10.0.0.1', action: 'failure', bytes: 200 },
  { ts: '2026-01-01T00:00:03Z', user: 'a', src_ip: '10.0.0.2', action: 'success', bytes: 30 }
];

test('siem: parses JSON arrays and JSON lines, flattening nested fields', () => {
  const events = parseSiemEvents(JSON.stringify(sample))!;
  assert.equal(events.length, 3);
  assert.equal(events[0]['geo.country'], 'UZ');
  assert.equal(parseSiemEvents(sample.map((event) => JSON.stringify(event)).join('\n'))!.length, 3);
  assert.equal(parseSiemEvents('plain log line\nanother'), null);
  assert.equal(parseSiemEvents('[1, 2]'), null);
});

test('siem: search terms, wildcards, NOT and numeric comparisons', () => {
  const events = parseSiemEvents(JSON.stringify(sample))!;
  const count = (query: string) => runSiemQuery(events, query).total;
  assert.equal(count(''), 3);
  assert.equal(count('action=failure'), 2);
  assert.equal(count('src_ip=10.0.0.* NOT user=b'), 2);
  assert.equal(count('action!=failure'), 1);
  assert.equal(count('bytes>=30'), 2);
  assert.equal(count('FAILURE'), 2, 'free text is case-insensitive');
  assert.equal(count('geo.country=uz'), 1);
  assert.throws(() => runSiemQuery(events, 'a OR b'), SiemQueryError);
  assert.throws(() => runSiemQuery(events, 'bytes>lots'), SiemQueryError);
  assert.throws(() => runSiemQuery(events, '"unclosed'), SiemQueryError);
});

test('siem: stats, sort, head, table and dedup', () => {
  const events = parseSiemEvents(JSON.stringify(sample))!;
  const grouped = runSiemQuery(events, 'action=failure | stats count, dc(user), sum(bytes) by src_ip');
  assert.deepEqual(grouped.columns, ['src_ip', 'count', 'dc(user)', 'sum(bytes)']);
  assert.deepEqual(grouped.rows, [{ src_ip: '10.0.0.1', count: 2, 'dc(user)': 2, 'sum(bytes)': 210 }]);
  assert.deepEqual(runSiemQuery(events, '| sort -bytes | head 1 | table user').rows, [{ user: 'b' }]);
  assert.equal(runSiemQuery(events, '| dedup user').total, 2);
  assert.deepEqual(runSiemQuery(events, '| stats count').rows, [{ count: 3 }]);
  assert.throws(() => runSiemQuery(events, '| stats median(bytes)'), SiemQueryError);
  assert.throws(() => runSiemQuery(events, '| frobnicate'), SiemQueryError);
});

test('siem case answers can be found with the hints', () => {
  const item = findInvestigationCase('siem-push-fatigue-beacon')!;
  const events = parseSiemEvents(item.evidence[0].content)!;
  const answer = (id: string) => item.questions.find((question) => question.id === id)!.answers[0];
  const first = (query: string) => runSiemQuery(events, query).rows[0];

  assert.ok(events.length > 1000);
  assert.equal(first('mfa_result=denied | stats count by user | sort -count').user, answer('q1'));
  assert.equal(String(first(`user=${answer('q1')} mfa_result=denied | stats count`).count), answer('q2'));
  assert.equal(first(`user=${answer('q1')} mfa_result=denied | stats count by src_ip`).src_ip, answer('q3'));
  assert.equal(first(`src_ip=${answer('q3')} action=success | table assigned_ip`).assigned_ip, answer('q4'));
  assert.equal(first('sourcetype=proxy | stats dc(src_ip) by url_domain | sort dc(src_ip)').url_domain, answer('q5'));
  const beacons = runSiemQuery(events, `url_domain=${answer('q5')} | table ts`).rows.map((row) => Date.parse(String(row.ts)));
  assert.ok(beacons.length > 10);
  assert.ok(beacons.slice(1).every((at, index) => (at - beacons[index]) / 1000 === Number(answer('q6'))));
  assert.equal(parseSiemEvents(findInvestigationCase('siem-push-fatigue-beacon')!.evidence[0].content)!.length, events.length, 'deterministic');
});
