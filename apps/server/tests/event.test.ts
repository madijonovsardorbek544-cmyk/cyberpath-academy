import test from 'node:test';
import assert from 'node:assert/strict';
import { annualEvent, eventSchedule, findUnlockedEventDay } from '@cyberpath/contracts/event';
import { findRealWorldIndicators, isCaseAnswerCorrect } from '@cyberpath/contracts/cases';
import { runShell } from '@cyberpath/contracts/shell';

test('event days unlock at midnight UTC and scoring closes after the window', () => {
  const at = (iso: string) => eventSchedule(annualEvent, '2026-12-01', new Date(iso));
  assert.equal(at('2026-11-30T23:59:59Z').status, 'upcoming');
  assert.equal(at('2026-11-30T23:59:59Z').days.filter((day) => day.unlocked).length, 0);
  assert.equal(at('2026-12-01T00:00:00Z').days.filter((day) => day.unlocked).length, 1);
  assert.equal(at('2026-12-03T12:00:00Z').days.filter((day) => day.unlocked).length, 3);
  assert.equal(at('2026-12-14T23:59:59Z').status, 'live');
  assert.equal(at('2026-12-15T00:00:00Z').status, 'closed');
  assert.equal(at('2026-12-15T00:00:00Z').closesAt, '2026-12-15T00:00:00.000Z');
  assert.equal(findUnlockedEventDay(annualEvent, '2026-12-01', 'event-2026-d02', new Date('2026-12-01T10:00:00Z')), null);
  assert.equal(findUnlockedEventDay(annualEvent, '2026-12-01', 'event-2026-d02', new Date('2026-12-02T00:00:00Z'))?.slug, 'event-2026-d02');
});

test('event content is well formed and uses only reserved indicators', () => {
  assert.equal(annualEvent.days.length, 12);
  assert.equal(new Set(annualEvent.days.map((day) => day.slug)).size, 12);
  for (const day of annualEvent.days) {
    assert.deepEqual(findRealWorldIndicators(day), [], day.slug);
    assert.equal(new Set(day.questions.map((question) => question.id)).size, day.questions.length, day.slug);
    for (const question of day.questions) {
      if (question.options) assert.ok(question.answers.every((answer) => question.options!.includes(answer)), `${day.slug}/${question.id}`);
      assert.ok(isCaseAnswerCorrect(question, question.answers[0]));
    }
  }
});

test('event answers can be found in the evidence with the browser shell', () => {
  const fsFor = (slug: string) => ({ case: Object.fromEntries(annualEvent.days.find((day) => day.slug === slug)!.evidence.map((item) => [item.name, item.content])) });
  const sh = (slug: string, command: string) => runShell(command, { fs: fsFor(slug), cwd: '/case', home: '/case' }).output.trim();
  assert.match(sh('event-2026-d08', 'cat encoded.txt | base64 -d | iconv -f utf-16le'), /198\.51\.100\.33/);
  assert.equal(sh('event-2026-d09', "grep 203.0.113.50 firewall.log | awk '{print $6}' | cut -d: -f2 | sort | uniq | wc -l"), '9');
  assert.equal(sh('event-2026-d10', 'cut -d, -f4 simulation-results.csv | grep -c yes'), '3');
  assert.equal(sh('event-2026-d03', 'grep -c 4625 logon-events.csv'), '5');
});
