import { initDb, many, one, fromDbJson } from '../src/lib/db.js';

type CheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

const minimums = {
  lessons: Number(process.env.MIN_LESSONS ?? 100),
  quizQuestions: Number(process.env.MIN_QUIZ_QUESTIONS ?? 500),
  labs: Number(process.env.MIN_LABS ?? 25),
  guidedProjects: Number(process.env.MIN_GUIDED_PROJECTS ?? 10),
  glossaryTerms: Number(process.env.MIN_GLOSSARY_TERMS ?? 150)
};

const unsafePatterns = [
  /credential theft/i,
  /steal password/i,
  /keylogger/i,
  /ransomware/i,
  /deploy malware/i,
  /persistence/i,
  /evade detection/i,
  /bypass mfa/i,
  /exploit live target/i,
  /phish real users/i,
  /real target/i,
  /unauthorized access/i
];

function count(table: string) {
  const row = one<{ value: number }>(`SELECT COUNT(*) as value FROM ${table}`);
  return Number(row?.value ?? 0);
}

function findDuplicateSlugs(table: string) {
  return many<{ slug: string; value: number }>(
    `SELECT slug, COUNT(*) as value FROM ${table} GROUP BY slug HAVING COUNT(*) > 1`
  );
}

function checkCount(name: string, actual: number, expected: number): CheckResult {
  return {
    name,
    passed: actual >= expected,
    details: `${actual}/${expected} minimum`
  };
}

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim().length === 0;
}

function hasUnsafeText(...values: unknown[]) {
  const text = values.map((value) => String(value ?? '')).join(' ');
  return unsafePatterns.find((pattern) => pattern.test(text))?.source ?? null;
}

function main() {
  initDb();
  const results: CheckResult[] = [];

  results.push(checkCount('lesson count', count('lessons'), minimums.lessons));
  results.push(checkCount('quiz question count', count('quiz_questions'), minimums.quizQuestions));
  results.push(checkCount('lab count', count('labs'), minimums.labs));
  results.push(checkCount('guided project count', count('guided_projects'), minimums.guidedProjects));
  results.push(checkCount('glossary term count', count('glossary_terms'), minimums.glossaryTerms));

  const duplicateLessonSlugs = findDuplicateSlugs('lessons');
  results.push({
    name: 'duplicate lesson slugs',
    passed: duplicateLessonSlugs.length === 0,
    details: duplicateLessonSlugs.length ? duplicateLessonSlugs.map((item) => `${item.slug} (${item.value})`).join(', ') : 'none'
  });

  const duplicateLabSlugs = findDuplicateSlugs('labs');
  results.push({
    name: 'duplicate lab slugs',
    passed: duplicateLabSlugs.length === 0,
    details: duplicateLabSlugs.length ? duplicateLabSlugs.map((item) => `${item.slug} (${item.value})`).join(', ') : 'none'
  });

  const lessons = many<Record<string, unknown>>('SELECT * FROM lessons');
  const incompleteLessons = lessons.filter((lesson) =>
    isBlank(lesson.slug) ||
    isBlank(lesson.title) ||
    isBlank(lesson.content) ||
    String(lesson.content).trim().length < 120 ||
    fromDbJson<unknown[]>(lesson.learning_objectives, []).length < 3 ||
    fromDbJson<unknown[]>(lesson.examples, []).length < 2 ||
    fromDbJson<unknown[]>(lesson.knowledge_checks, []).length < 3 ||
    isBlank(lesson.common_mistakes) ||
    isBlank(lesson.why_it_matters)
  );
  results.push({
    name: 'lesson completeness',
    passed: incompleteLessons.length === 0,
    details: incompleteLessons.length ? `${incompleteLessons.length} incomplete lesson(s)` : 'all lessons have core fields'
  });

  const questions = many<Record<string, unknown>>('SELECT * FROM quiz_questions');
  const invalidQuestions = questions.filter((question) =>
    isBlank(question.lesson_id) ||
    isBlank(question.prompt) ||
    isBlank(question.type) ||
    isBlank(question.topic) ||
    isBlank(question.subtopic) ||
    isBlank(question.explanation) ||
    question.answer === null ||
    question.answer === undefined ||
    String(question.answer).trim().length === 0
  );
  results.push({
    name: 'quiz question validity',
    passed: invalidQuestions.length === 0,
    details: invalidQuestions.length ? `${invalidQuestions.length} invalid question(s)` : 'all questions have prompts, explanations, and answers'
  });

  const lessonsWithoutQuestions = many<Record<string, unknown>>(
    `SELECT l.slug, l.title, COUNT(q.id) as question_count
     FROM lessons l
     LEFT JOIN quiz_questions q ON q.lesson_id = l.id
     GROUP BY l.id
     HAVING COUNT(q.id) < 4`
  );
  results.push({
    name: 'lesson question coverage',
    passed: lessonsWithoutQuestions.length === 0,
    details: lessonsWithoutQuestions.length ? `${lessonsWithoutQuestions.length} lesson(s) have fewer than 4 questions` : 'every lesson has at least 4 questions'
  });

  const labs = many<Record<string, unknown>>('SELECT * FROM labs');
  const invalidLabs = labs.filter((lab) => {
    const tasks = fromDbJson<Array<{ id?: string; prompt?: string; expectedKeywords?: string[] }>>(lab.tasks, []);
    return isBlank(lab.slug) ||
      isBlank(lab.title) ||
      isBlank(lab.description) ||
      isBlank(lab.safe_guardrails) ||
      isBlank(lab.solution_outline) ||
      tasks.length < 2 ||
      tasks.some((task) => isBlank(task.id) || isBlank(task.prompt) || !Array.isArray(task.expectedKeywords) || task.expectedKeywords.length < 2);
  });
  results.push({
    name: 'lab validity',
    passed: invalidLabs.length === 0,
    details: invalidLabs.length ? `${invalidLabs.length} invalid lab(s)` : 'all labs have guardrails, solution outlines, and tasks'
  });

  const unsafeLabs = labs
    .map((lab) => ({ lab, pattern: hasUnsafeText(lab.title, lab.description, lab.dataset, lab.tasks, lab.safe_guardrails, lab.solution_outline) }))
    .filter((item) => item.pattern);
  results.push({
    name: 'lab safety wording',
    passed: unsafeLabs.length === 0,
    details: unsafeLabs.length ? unsafeLabs.map((item) => `${String(item.lab.slug)} matched ${item.pattern}`).join('; ') : 'no unsafe lab wording detected'
  });

  const projects = many<Record<string, unknown>>('SELECT * FROM guided_projects');
  const invalidProjects = projects.filter((project) =>
    isBlank(project.slug) ||
    isBlank(project.title) ||
    isBlank(project.summary) ||
    fromDbJson<unknown[]>(project.checkpoints_json, []).length < 3 ||
    fromDbJson<unknown[]>(project.rubric_json, []).length < 3
  );
  results.push({
    name: 'guided project validity',
    passed: invalidProjects.length === 0,
    details: invalidProjects.length ? `${invalidProjects.length} invalid guided project(s)` : 'all guided projects have checkpoints and rubrics'
  });

  const failed = results.filter((result) => !result.passed);

  console.log('\nCyberPath curriculum verification');
  console.log('================================');
  for (const result of results) {
    console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.details}`);
  }

  if (failed.length) {
    console.error(`\nVerification failed: ${failed.length} check(s) did not pass.`);
    process.exit(1);
  }

  console.log('\nVerification passed. Curriculum baseline is healthy.');
}

main();
