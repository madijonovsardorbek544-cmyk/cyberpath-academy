import test from 'node:test';
import assert from 'node:assert/strict';
import { analystExam, examPassed, examQuestionPoints, examReportPoints, gradeExamAnswers, scoreReport, toPublicExam } from '@cyberpath/contracts/exam';
import { findRealWorldIndicators } from '@cyberpath/contracts/cases';

const allCorrect = () => Object.fromEntries(analystExam.sections.flatMap((section) => section.questions.map((question) => [`${section.id}.${question.id}`, question.answers[0]])));

test('exam totals 100 points and passing needs both parts', () => {
  assert.equal(examQuestionPoints(analystExam) + examReportPoints(analystExam), 100);
  assert.equal(gradeExamAnswers(analystExam, allCorrect()).total, examQuestionPoints(analystExam));
  assert.equal(gradeExamAnswers(analystExam, {}).total, 0);
  assert.equal(examPassed(analystExam, 60, 19), false, 'a weak report fails even with every answer right');
  assert.equal(examPassed(analystExam, 48, 22), true);
  assert.equal(examPassed(analystExam, 40, 25), false, 'below the overall pass mark');
});

test('report scores are clamped to the rubric', () => {
  const report = scoreReport(analystExam, { timeline: 50, scope: -3, response: 7.6 });
  assert.deepEqual(report.criteria.map((criterion) => criterion.earned), [10, 0, 8, 0]);
  assert.equal(report.total, 18);
});

test('the candidate view never contains answers, hints or explanations', () => {
  const text = JSON.stringify(toPublicExam(analystExam));
  assert.ok(!/"answers"|"explanation"|"hint"/.test(text));
  for (const section of analystExam.sections) {
    assert.deepEqual(findRealWorldIndicators({ evidence: section.evidence, questions: section.questions, story: section.brief }), [], section.id);
    for (const question of section.questions) {
      if (question.options) assert.ok(question.answers.every((answer) => question.options!.includes(answer)), question.id);
      else assert.ok(section.evidence.some((item) => item.content.includes(question.answers[0])), `${section.id}.${question.id} answer should appear in the evidence`);
    }
  }
});
