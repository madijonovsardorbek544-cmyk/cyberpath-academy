import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeSocShift, socShifts, toPublicShift, type SocDecision, type SocShift } from '@cyberpath/contracts/soc';

function perfect(shift: SocShift): SocDecision[] {
  return shift.alerts.map((alert) => ({
    alertId: alert.id,
    verdict: alert.key.verdict,
    severity: alert.key.verdict === 'true_positive' ? alert.key.severity : undefined,
    note: alert.key.noteChecks.map((check) => check.any[0]).join(' ') || 'Expected activity, closing.'
  }));
}

test('every shift is well formed and balanced', () => {
  for (const shift of socShifts) {
    assert.equal(new Set(shift.alerts.map((alert) => alert.id)).size, shift.alerts.length);
    const tp = shift.alerts.filter((alert) => alert.key.verdict === 'true_positive').length;
    assert.ok(tp > 0 && tp < shift.alerts.length, `${shift.slug} mixes real alerts and noise`);
    for (const alert of shift.alerts) assert.ok(alert.key.explanation && alert.context.length > 0 && alert.key.noteChecks.length > 0);
  }
});

test('a perfect shift scores full marks', () => {
  for (const shift of socShifts) {
    const result = gradeSocShift(shift, perfect(shift));
    assert.equal(result.score, result.maxScore, shift.slug);
    assert.equal(result.correctVerdicts, shift.alerts.length);
  }
});

test('wrong verdicts score no verdict or severity points, and near-miss severity earns partial credit', () => {
  const shift = socShifts[0];
  const decisions = perfect(shift);
  const real = shift.alerts.find((alert) => alert.key.verdict === 'true_positive' && alert.key.severity === 'high')!;
  const flipped = decisions.map((decision) => decision.alertId === real.id ? { ...decision, verdict: 'false_positive' as const } : decision);
  const flippedResult = gradeSocShift(shift, flipped).alerts.find((alert) => alert.alertId === real.id)!;
  assert.equal(flippedResult.verdictCorrect, false);
  assert.equal(flippedResult.severityPoints, 0);

  const nearMiss = decisions.map((decision) => decision.alertId === real.id ? { ...decision, severity: 'critical' as const } : decision);
  assert.equal(gradeSocShift(shift, nearMiss).alerts.find((alert) => alert.alertId === real.id)!.severityPoints, 2);
});

test('empty notes lose note points and list what was missed', () => {
  const shift = socShifts[0];
  const result = gradeSocShift(shift, perfect(shift).map((decision) => ({ ...decision, note: 'looked at it' })));
  assert.ok(result.alerts.every((alert) => alert.notePoints === 0 && alert.missedNoteChecks.length > 0));
});

test('public shift view hides the grading key', () => {
  for (const shift of socShifts) assert.ok(!JSON.stringify(toPublicShift(shift)).includes('"key"'));
});
