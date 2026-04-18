import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

const dbPath = env.databasePath;
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export type Role = 'student' | 'mentor' | 'admin';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved';
export type EmailStatus = 'queued' | 'sent' | 'failed';
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';

export function makeId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function toDbJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function fromDbJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

export function one<T extends Record<string, unknown> | null>(sql: string, ...params: unknown[]): T {
  return db.prepare(sql).get(...(params as any[])) as T;
}

export function many<T extends Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...(params as any[])) as T[];
}

export function run(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...(params as any[]));
}

export function count(sql: string, ...params: unknown[]) {
  const row = one<{ value: number }>(sql, ...params);
  return Number(row?.value ?? 0);
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      goal TEXT,
      experience_level TEXT,
      placement_score INTEGER,
      roadmap_json TEXT,
      streak_days INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_students (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(mentor_id, student_id),
      FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      phase INTEGER NOT NULL,
      phase_title TEXT NOT NULL,
      level TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      specialization TEXT,
      estimated_minutes INTEGER NOT NULL DEFAULT 20,
      learning_objectives TEXT NOT NULL,
      content TEXT NOT NULL,
      glossary TEXT NOT NULL,
      examples TEXT NOT NULL,
      knowledge_checks TEXT NOT NULL,
      common_mistakes TEXT NOT NULL,
      why_it_matters TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'shield',
      version INTEGER NOT NULL DEFAULT 1,
      last_reviewed_at TEXT,
      review_due_at TEXT,
      reviewed_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      topic TEXT NOT NULL,
      subtopic TEXT NOT NULL,
      explanation TEXT NOT NULL,
      scenario_context TEXT,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      time_spent_minutes INTEGER NOT NULL DEFAULT 0,
      last_opened_at TEXT NOT NULL,
      UNIQUE(user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      difficulty TEXT NOT NULL,
      time_spent_minutes INTEGER NOT NULL DEFAULT 0,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT,
      question_id TEXT,
      topic TEXT NOT NULL,
      subtopic TEXT NOT NULL,
      prompt TEXT NOT NULL,
      explanation TEXT NOT NULL,
      user_answer TEXT,
      correct_answer TEXT,
      notes TEXT,
      repeat_count INTEGER NOT NULL DEFAULT 1,
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS labs (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL,
      dataset TEXT NOT NULL,
      tasks TEXT NOT NULL,
      safe_guardrails TEXT NOT NULL,
      solution_outline TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lab_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      feedback TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS glossary_terms (
      id TEXT PRIMARY KEY,
      term TEXT NOT NULL UNIQUE,
      definition TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS capstone_ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      specialization TEXT NOT NULL,
      summary TEXT NOT NULL,
      deliverables TEXT NOT NULL,
      difficulty TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_feedback (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS platform_feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS email_outbox (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      text_body TEXT NOT NULL,
      html_body TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      provider TEXT NOT NULL DEFAULT 'console',
      message_type TEXT NOT NULL,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_error_events (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      user_id TEXT,
      method TEXT,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'trialing',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      current_period_end TEXT,
      provider_customer_id TEXT,
      provider_subscription_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS specialization_tracks (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      description TEXT NOT NULL,
      framework_ref TEXT NOT NULL,
      track_type TEXT NOT NULL DEFAULT 'career',
      estimated_hours INTEGER NOT NULL DEFAULT 12,
      hero TEXT NOT NULL DEFAULT '',
      target_roles TEXT NOT NULL,
      milestone_json TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      outcomes_json TEXT NOT NULL DEFAULT '[]',
      entry_points_json TEXT NOT NULL DEFAULT '[]',
      prerequisites_json TEXT NOT NULL DEFAULT '[]',
      recommended_for_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS track_lesson_links (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      competency TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 1,
      UNIQUE(track_id, lesson_id),
      FOREIGN KEY (track_id) REFERENCES specialization_tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_artifacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artifact_type TEXT NOT NULL,
      specialization TEXT NOT NULL,
      summary TEXT NOT NULL,
      deliverables_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      evidence_url TEXT,
      mentor_feedback TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificate_awards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      track_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'eligible',
      criteria_json TEXT NOT NULL,
      issued_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cohorts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      mentor_id TEXT NOT NULL,
      cadence TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cohort_members (
      id TEXT PRIMARY KEY,
      cohort_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      membership_role TEXT NOT NULL DEFAULT 'student',
      joined_at TEXT NOT NULL,
      UNIQUE(cohort_id, user_id),
      FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mentor_alerts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      mentor_id TEXT,
      cohort_id TEXT,
      severity TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(student_id, alert_type),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS review_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT,
      topic TEXT NOT NULL,
      subtopic TEXT,
      prompt TEXT NOT NULL,
      due_at TEXT NOT NULL,
      last_reviewed_at TEXT,
      interval_days INTEGER NOT NULL DEFAULT 1,
      ease_factor REAL NOT NULL DEFAULT 2.3,
      status TEXT NOT NULL DEFAULT 'due',
      success_streak INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, source_type, source_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_revisions (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      change_summary TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_assignments (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      lesson_id TEXT,
      track_slug TEXT,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      target_mastery INTEGER,
      due_at TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      rubric_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS guided_projects (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      specialization TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      summary TEXT NOT NULL,
      estimated_hours INTEGER NOT NULL DEFAULT 4,
      checkpoints_json TEXT NOT NULL,
      rubric_json TEXT NOT NULL,
      starter_lesson_slug TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learner_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      guided_project_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started',
      checkpoint_progress_json TEXT NOT NULL DEFAULT '[]',
      reflection TEXT,
      evidence_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, guided_project_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (guided_project_id) REFERENCES guided_projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_mistakes_user ON mistakes(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_student ON mentor_feedback(student_id);
    CREATE INDEX IF NOT EXISTS idx_mentor_links_mentor ON mentor_students(mentor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
    CREATE INDEX IF NOT EXISTS idx_platform_feedback_status ON platform_feedback(status);
    CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status);
    CREATE INDEX IF NOT EXISTS idx_app_error_events_created ON app_error_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_track_links_track ON track_lesson_links(track_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_artifacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificate_user ON certificate_awards(user_id);
    CREATE INDEX IF NOT EXISTS idx_cohort_members_user ON cohort_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_mentor_alerts_student ON mentor_alerts(student_id);
    CREATE INDEX IF NOT EXISTS idx_review_queue_user_due ON review_queue(user_id, due_at);
    CREATE INDEX IF NOT EXISTS idx_lesson_revisions_lesson ON lesson_revisions(lesson_id, version);
    CREATE INDEX IF NOT EXISTS idx_mentor_assignments_student ON mentor_assignments(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_learner_projects_user ON learner_projects(user_id, status);
  `);

  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN track_type TEXT NOT NULL DEFAULT 'career';"); } catch {}
  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN estimated_hours INTEGER NOT NULL DEFAULT 12;"); } catch {}
  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN hero TEXT NOT NULL DEFAULT '';"); } catch {}
  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN outcomes_json TEXT NOT NULL DEFAULT '[]';"); } catch {}
  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN entry_points_json TEXT NOT NULL DEFAULT '[]';"); } catch {}
  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN prerequisites_json TEXT NOT NULL DEFAULT '[]';"); } catch {}
  try { db.exec("ALTER TABLE specialization_tracks ADD COLUMN recommended_for_json TEXT NOT NULL DEFAULT '[]';"); } catch {}
  try { db.exec("ALTER TABLE lessons ADD COLUMN version INTEGER NOT NULL DEFAULT 1;"); } catch {}
  try { db.exec("ALTER TABLE lessons ADD COLUMN last_reviewed_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE lessons ADD COLUMN review_due_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE lessons ADD COLUMN reviewed_by TEXT;"); } catch {}
}

export function mapUser(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as Role,
    goal: row.goal ? String(row.goal) : null,
    experienceLevel: row.experience_level ? String(row.experience_level) : null,
    placementScore: row.placement_score === null || row.placement_score === undefined ? null : Number(row.placement_score),
    roadmapJson: fromDbJson(row.roadmap_json, null),
    streakDays: Number(row.streak_days ?? 0),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined
  };
}

export function mapLesson(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    phase: Number(row.phase),
    phaseTitle: String(row.phase_title),
    level: String(row.level),
    orderIndex: Number(row.order_index),
    specialization: row.specialization ? String(row.specialization) : null,
    estimatedMinutes: Number(row.estimated_minutes),
    learningObjectives: fromDbJson<string[]>(row.learning_objectives, []),
    content: String(row.content),
    glossary: fromDbJson<Array<{ term: string; definition: string }>>(row.glossary, []),
    examples: fromDbJson<string[]>(row.examples, []),
    knowledgeChecks: fromDbJson<string[]>(row.knowledge_checks, []),
    commonMistakes: String(row.common_mistakes),
    whyItMatters: String(row.why_it_matters),
    icon: row.icon ? String(row.icon) : 'shield',
    version: Number(row.version ?? 1),
    lastReviewedAt: row.last_reviewed_at ? String(row.last_reviewed_at) : null,
    reviewDueAt: row.review_due_at ? String(row.review_due_at) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapQuestion(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    lessonId: String(row.lesson_id),
    prompt: String(row.prompt),
    type: String(row.type),
    difficulty: String(row.difficulty),
    topic: String(row.topic),
    subtopic: String(row.subtopic),
    explanation: String(row.explanation),
    scenarioContext: row.scenario_context ? String(row.scenario_context) : null,
    options: fromDbJson(row.options, null),
    answer: fromDbJson(row.answer, null),
    createdAt: String(row.created_at)
  };
}

export function mapLab(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    difficulty: String(row.difficulty),
    description: String(row.description),
    dataset: fromDbJson(row.dataset, {}),
    tasks: fromDbJson<Array<{ id: string; prompt: string; expectedKeywords: string[] }>>(row.tasks, []),
    safeGuardrails: String(row.safe_guardrails),
    solutionOutline: String(row.solution_outline)
  };
}

export function mapMistake(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    questionId: row.question_id ? String(row.question_id) : null,
    topic: String(row.topic),
    subtopic: String(row.subtopic),
    prompt: String(row.prompt),
    explanation: String(row.explanation),
    userAnswer: fromDbJson(row.user_answer, null),
    correctAnswer: fromDbJson(row.correct_answer, null),
    notes: row.notes ? String(row.notes) : null,
    repeatCount: Number(row.repeat_count),
    lastSeenAt: String(row.last_seen_at),
    createdAt: String(row.created_at)
  };
}

export function mapAttempt(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    lessonId: String(row.lesson_id),
    score: Number(row.score),
    accuracy: Number(row.accuracy),
    difficulty: String(row.difficulty),
    timeSpentMinutes: Number(row.time_spent_minutes),
    details: fromDbJson(row.details, {}),
    createdAt: String(row.created_at)
  };
}

export function mapCapstone(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    specialization: String(row.specialization),
    summary: String(row.summary),
    deliverables: fromDbJson<string[]>(row.deliverables, []),
    difficulty: String(row.difficulty)
  };
}

export function mapFeedback(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    name: String(row.name),
    email: String(row.email),
    category: String(row.category),
    message: String(row.message),
    status: String(row.status) as FeedbackStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapEmail(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    toEmail: String(row.to_email),
    subject: String(row.subject),
    textBody: String(row.text_body),
    htmlBody: row.html_body ? String(row.html_body) : null,
    status: String(row.status) as EmailStatus,
    provider: String(row.provider),
    messageType: String(row.message_type),
    metadata: fromDbJson(row.metadata, {}),
    createdAt: String(row.created_at),
    sentAt: row.sent_at ? String(row.sent_at) : null
  };
}

export function mapSubscription(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planId: String(row.plan_id),
    status: String(row.status) as SubscriptionStatus,
    billingCycle: String(row.billing_cycle),
    currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
    providerCustomerId: row.provider_customer_id ? String(row.provider_customer_id) : null,
    providerSubscriptionId: row.provider_subscription_id ? String(row.provider_subscription_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapAuditLog(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    actorRole: row.actor_role ? String(row.actor_role) : null,
    action: String(row.action),
    targetType: String(row.target_type),
    targetId: row.target_id ? String(row.target_id) : null,
    metadata: fromDbJson(row.metadata, {}),
    createdAt: String(row.created_at)
  };
}

export function mapTrack(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    level: String(row.level),
    description: String(row.description),
    frameworkRef: String(row.framework_ref),
    trackType: String(row.track_type ?? 'career'),
    estimatedHours: Number(row.estimated_hours ?? 12),
    hero: String(row.hero ?? ''),
    targetRoles: fromDbJson<string[]>(row.target_roles, []),
    milestones: fromDbJson<string[]>(row.milestone_json, []),
    skills: fromDbJson<string[]>(row.skills_json, []),
    outcomes: fromDbJson<string[]>(row.outcomes_json, []),
    entryPoints: fromDbJson<string[]>(row.entry_points_json, []),
    prerequisites: fromDbJson<string[]>(row.prerequisites_json, []),
    recommendedFor: fromDbJson<string[]>(row.recommended_for_json, []),
    createdAt: String(row.created_at)
  };
}

export function mapPortfolioArtifact(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    artifactType: String(row.artifact_type),
    specialization: String(row.specialization),
    summary: String(row.summary),
    deliverables: fromDbJson<string[]>(row.deliverables_json, []),
    status: String(row.status),
    evidenceUrl: row.evidence_url ? String(row.evidence_url) : null,
    mentorFeedback: row.mentor_feedback ? String(row.mentor_feedback) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapCertificate(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    trackSlug: String(row.track_slug),
    title: String(row.title),
    status: String(row.status),
    criteria: fromDbJson(row.criteria_json, {}),
    issuedAt: row.issued_at ? String(row.issued_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapCohort(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    mentorId: String(row.mentor_id),
    cadence: String(row.cadence),
    startDate: String(row.start_date),
    endDate: row.end_date ? String(row.end_date) : null,
    createdAt: String(row.created_at)
  };
}

export function mapMentorAlert(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    mentorId: row.mentor_id ? String(row.mentor_id) : null,
    cohortId: row.cohort_id ? String(row.cohort_id) : null,
    severity: String(row.severity),
    alertType: String(row.alert_type),
    summary: String(row.summary),
    recommendation: String(row.recommendation),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapReviewItem(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    sourceType: String(row.source_type),
    sourceId: row.source_id ? String(row.source_id) : null,
    topic: String(row.topic),
    subtopic: row.subtopic ? String(row.subtopic) : null,
    prompt: String(row.prompt),
    dueAt: String(row.due_at),
    lastReviewedAt: row.last_reviewed_at ? String(row.last_reviewed_at) : null,
    intervalDays: Number(row.interval_days ?? 1),
    easeFactor: Number(row.ease_factor ?? 2.3),
    successStreak: Number(row.success_streak ?? 0),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapMentorAssignment(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    mentorId: String(row.mentor_id),
    studentId: String(row.student_id),
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    trackSlug: row.track_slug ? String(row.track_slug) : null,
    title: String(row.title),
    instructions: String(row.instructions),
    targetMastery: row.target_mastery === null || row.target_mastery === undefined ? null : Number(row.target_mastery),
    dueAt: row.due_at ? String(row.due_at) : null,
    status: String(row.status),
    rubric: fromDbJson<string[]>(row.rubric_json, []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapGuidedProject(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    specialization: String(row.specialization),
    difficulty: String(row.difficulty),
    summary: String(row.summary),
    estimatedHours: Number(row.estimated_hours ?? 4),
    checkpoints: fromDbJson<string[]>(row.checkpoints_json, []),
    rubric: fromDbJson<string[]>(row.rubric_json, []),
    starterLessonSlug: row.starter_lesson_slug ? String(row.starter_lesson_slug) : null,
    createdAt: String(row.created_at)
  };
}

export function mapLearnerProject(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    guidedProjectId: String(row.guided_project_id),
    status: String(row.status),
    checkpointProgress: fromDbJson<string[]>(row.checkpoint_progress_json, []),
    reflection: row.reflection ? String(row.reflection) : null,
    evidenceUrl: row.evidence_url ? String(row.evidence_url) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapLessonRevision(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    lessonId: String(row.lesson_id),
    version: Number(row.version),
    snapshot: fromDbJson<Record<string, unknown>>(row.snapshot_json, {}),
    changeSummary: row.change_summary ? String(row.change_summary) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at)
  };
}
