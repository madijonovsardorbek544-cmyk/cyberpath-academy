// Loads the 12 Uzbek cohort lessons from docs/course-uz into the lessons and quiz_questions tables.
// Additive and idempotent: it only touches rows with slug uz-cohort-* and question ids uz-cohort-*.
// Run manually after the lessons are reviewed: npm run seed:cohort-uz --workspace server
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, makeId, nowIso, one, run, toDbJson } from '../src/lib/db.js';
import { parseCourseLesson } from '../src/utils/courseMarkdown.js';

const courseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/course-uz');
const PHASE = 11;
const PHASE_TITLE = 'Kiberxavfsizlik asoslari (oʻzbek tilida, 6 hafta)';

function main() {
  initDb();
  const files = fs.readdirSync(courseDir).filter((file) => /^(0[1-9]|1\d)-.+\.md$/.test(file)).sort();
  const drafts: string[] = [];
  const now = nowIso();

  for (const file of files) {
    const lesson = parseCourseLesson(fs.readFileSync(path.join(courseDir, file), 'utf8'), file);
    if (lesson.isDraft) drafts.push(file);
    const existing = one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE slug = ?', lesson.slug);
    const lessonId = existing ? String(existing.id) : makeId();

    run(
      `INSERT INTO lessons (id, slug, title, phase, phase_title, level, order_index, specialization, estimated_minutes, learning_objectives, content, glossary, examples, knowledge_checks, common_mistakes, why_it_matters, icon, version, last_reviewed_at, review_due_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Beginner', ?, 'soc', ?, ?, ?, '[]', '[]', ?, '', ?, 'shield', 1, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         phase = excluded.phase,
         phase_title = excluded.phase_title,
         order_index = excluded.order_index,
         estimated_minutes = excluded.estimated_minutes,
         learning_objectives = excluded.learning_objectives,
         content = excluded.content,
         knowledge_checks = excluded.knowledge_checks,
         why_it_matters = excluded.why_it_matters,
         version = lessons.version + 1,
         last_reviewed_at = excluded.last_reviewed_at,
         review_due_at = excluded.review_due_at,
         updated_at = excluded.updated_at`,
      lessonId,
      lesson.slug,
      lesson.title,
      PHASE,
      PHASE_TITLE,
      lesson.order,
      lesson.estimatedMinutes,
      toDbJson(lesson.objectives),
      lesson.content,
      toDbJson(lesson.knowledgeChecks),
      lesson.whyItMatters,
      now,
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      now,
      now
    );

    // Stable question ids keep learners' mistake notebook and review items linked across reloads.
    const ids = lesson.questions.map((question) => question.id);
    run(`DELETE FROM quiz_questions WHERE lesson_id = ? AND id NOT IN (${ids.map(() => '?').join(',')})`, lessonId, ...ids);
    for (const question of lesson.questions) {
      run(
        `INSERT INTO quiz_questions (id, lesson_id, prompt, type, difficulty, topic, subtopic, explanation, scenario_context, options, answer, created_at)
         VALUES (?, ?, ?, ?, 'Beginner', 'Oʻzbek kursi', ?, ?, NULL, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           prompt = excluded.prompt, type = excluded.type, subtopic = excluded.subtopic,
           explanation = excluded.explanation, options = excluded.options, answer = excluded.answer`,
        question.id,
        lessonId,
        question.prompt,
        question.type,
        lesson.title,
        question.explanation,
        toDbJson(question.options),
        toDbJson(question.answer),
        // created_at orders questions on the lesson page, so space them by question number.
        new Date(Date.parse(now) + Number(question.id.split('-q')[1]) * 1000).toISOString()
      );
    }
  }

  console.log(`Uzbek cohort: ${files.length} lessons loaded into phase ${PHASE}.`);
  if (drafts.length) {
    console.warn(`Still marked "Qoralama" (draft, needs native-speaker review): ${drafts.join(', ')}`);
  }
}

main();
