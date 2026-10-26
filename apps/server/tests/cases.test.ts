import test from 'node:test';
import assert from 'node:assert/strict';
import { casePointsFor, findInvestigationCase, investigationCases, isCaseAnswerCorrect, normalizeCaseAnswer, toPublicCase } from '@cyberpath/contracts/cases';

function evidenceOf(slug: string, id: string) {
  const item = findInvestigationCase(slug);
  const evidence = item?.evidence.find((entry) => entry.id === id);
  assert.ok(evidence, `${slug}/${id} exists`);
  return evidence.content;
}

function answerOf(slug: string, questionId: string) {
  return findInvestigationCase(slug)!.questions.find((question) => question.id === questionId)!.answers[0];
}

test('every case is well formed', () => {
  const slugs = new Set<string>();
  for (const item of investigationCases) {
    assert.ok(!slugs.has(item.slug), `duplicate slug ${item.slug}`);
    slugs.add(item.slug);
    assert.ok(item.evidence.length > 0 && item.questions.length >= 4, `${item.slug} has evidence and questions`);
    assert.equal(new Set(item.questions.map((question) => question.id)).size, item.questions.length, `${item.slug} question ids are unique`);
    for (const question of item.questions) {
      assert.ok(question.answers.length > 0 && question.points > 0 && question.explanation && question.hint, `${item.slug}/${question.id} is complete`);
      if (question.options) {
        assert.equal(question.answers.length, 1, `${item.slug}/${question.id} has one correct option`);
        assert.ok(question.options.includes(question.answers[0]), `${item.slug}/${question.id} answer is one of the options`);
      }
    }
  }
});

test('evidence uses only reserved documentation addresses and domains', () => {
  for (const item of investigationCases) {
    for (const evidence of item.evidence) {
      for (const ip of evidence.content.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) ?? []) {
        assert.match(ip, /^(10\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/, `${item.slug}/${evidence.id} uses non-reserved IP ${ip}`);
      }
    }
  }
});

test('answers that can be derived from evidence match the evidence', () => {
  const spray = evidenceOf('vpn-password-spray', 'vpn-log').split('\n').filter((line) => line.includes('src=203.0.113.45') && / auth: /.test(line));
  const sprayedUsers = new Set(spray.map((line) => line.match(/user=(\S+)/)![1]));
  assert.equal(String(sprayedUsers.size), answerOf('vpn-password-spray', 'q2'));

  const conn = evidenceOf('night-time-upload', 'conn').split('\n').slice(1).map((line) => line.trim().split(/\s+/));
  const sent = conn.filter((cols) => cols[2] === '10.20.4.17' && cols[4] === '203.0.113.80').reduce((sum, cols) => sum + Number(cols[9]), 0);
  assert.equal(String(sent), answerOf('night-time-upload', 'q4'));
  assert.equal(sent, 720 * 1024 * 1024);

  const errors = evidenceOf('products-page-sqli', 'access').split('\n').filter((line) => line.startsWith('198.51.100.66 ') && / 500 \d+ /.test(line));
  assert.equal(String(errors.length), answerOf('products-page-sqli', 'q4'));

  const events = JSON.parse(evidenceOf('macro-powershell-persistence', 'sysmon')) as Array<{ CommandLine?: string }>;
  const encoded = events.map((event) => event.CommandLine?.match(/-Enc (\S+)/)?.[1]).find(Boolean)!;
  assert.ok(Buffer.from(encoded, 'base64').toString('utf16le').includes(answerOf('macro-powershell-persistence', 'q2')));
});

test('answer matching is forgiving about case, quotes, spacing and thousands separators', () => {
  const question = findInvestigationCase('night-time-upload')!.questions.find((entry) => entry.id === 'q4')!;
  assert.ok(isCaseAnswerCorrect(question, ' 754,974,720 '));
  assert.ok(!isCaseAnswerCorrect(question, '754974721'));
  assert.ok(!isCaseAnswerCorrect(question, '   '));
  assert.equal(normalizeCaseAnswer('  "J.Okafor" '), 'j.okafor');
});

test('multiple-choice solves after a wrong pick earn half points', () => {
  const choice = findInvestigationCase('vpn-password-spray')!.questions.find((entry) => entry.options)!;
  const typed = findInvestigationCase('vpn-password-spray')!.questions.find((entry) => !entry.options)!;
  assert.equal(casePointsFor(choice, 1), choice.points);
  assert.equal(casePointsFor(choice, 2), Math.floor(choice.points / 2));
  assert.equal(casePointsFor(typed, 5), typed.points);
});

test('public case view never contains answers or the debrief', () => {
  for (const item of investigationCases) {
    const json = JSON.stringify(toPublicCase(item));
    assert.ok(!json.includes('"answers"') && !json.includes('"explanation"') && !json.includes('"debrief"'));
  }
});
