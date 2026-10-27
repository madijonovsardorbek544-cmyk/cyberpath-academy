import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, leaderboardName, levelForXp, nextTier, weekStartOf } from '@cyberpath/contracts/gamification';

test('weeks start on Monday in UTC', () => {
  assert.equal(weekStartOf(new Date('2026-10-26T18:00:00Z')), '2026-10-26'); // Monday
  assert.equal(weekStartOf(new Date('2026-11-01T23:59:59Z')), '2026-10-26'); // Sunday
  assert.equal(weekStartOf(new Date('2026-11-02T00:00:00Z')), '2026-11-02');
});

test('levels grow quadratically and report progress to the next level', () => {
  assert.deepEqual(levelForXp(0), { level: 1, currentLevelXp: 0, nextLevelXp: 50 });
  assert.deepEqual(levelForXp(50), { level: 2, currentLevelXp: 0, nextLevelXp: 150 });
  assert.deepEqual(levelForXp(260), { level: 3, currentLevelXp: 60, nextLevelXp: 250 });
});

test('streak counts consecutive days and is not broken before today is over', () => {
  assert.equal(computeStreak(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26').current, 3);
  const notYetToday = computeStreak(['2026-10-24', '2026-10-25'], '2026-10-26');
  assert.equal(notYetToday.current, 2);
  assert.equal(notYetToday.activeToday, false);
  assert.equal(computeStreak(['2026-10-23'], '2026-10-26').current, 0);
  assert.equal(computeStreak([], '2026-10-26').current, 0);
});

test('one missed day per week is bridged by a freeze, two are not', () => {
  // Wed 21 Oct missed, same week as Mon 19 / Tue 20 / Thu 22.
  const bridged = computeStreak(['2026-10-19', '2026-10-20', '2026-10-22', '2026-10-23'], '2026-10-23');
  assert.equal(bridged.current, 4);
  assert.deepEqual(bridged.freezesUsed, ['2026-10-21']);
  // Two misses in the same week: the streak stops at the second gap.
  assert.equal(computeStreak(['2026-10-19', '2026-10-21', '2026-10-23'], '2026-10-23').current, 2);
  // Two consecutive missed days are never bridged.
  assert.equal(computeStreak(['2026-10-19', '2026-10-22'], '2026-10-22').current, 1);
});

test('league movement promotes the top, demotes the bottom of big groups only', () => {
  assert.equal(nextTier(0, 1, 3, 100), 1);
  assert.equal(nextTier(0, 1, 3, 0), 0);
  assert.equal(nextTier(4, 1, 30, 500), 4);
  assert.equal(nextTier(2, 30, 30, 0), 1);
  assert.equal(nextTier(2, 9, 9, 0), 2);
  assert.equal(nextTier(0, 30, 30, 0), 0);
  assert.equal(nextTier(2, 15, 30, 40), 2);
});

test('leaderboard names hide surnames', () => {
  assert.equal(leaderboardName('Amina Student'), 'Amina S.');
  assert.equal(leaderboardName('  Bob  '), 'Bob');
  assert.equal(leaderboardName(''), 'Learner');
  assert.equal(leaderboardName('Ana Maria de souza'), 'Ana S.');
});
