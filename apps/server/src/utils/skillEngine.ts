import { fromDbJson, makeId, many, mapLab, mapLesson, nowIso, one, run, toDbJson } from '../lib/db.js';
import { upsertReviewItem } from './learningIntelligence.js';

type MasteryState = 'not_started' | 'introduced' | 'practiced' | 'proficient' | 'mastered' | 'needs_review';
export type PracticeMode = 'learn' | 'practice' | 'review' | 'mastery_challenge' | 'lab_prep';

type Exercise = {
  id: string;
  skillId: string;
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'matching' | 'short_answer' | 'scenario_classification' | 'evidence_selection' | 'risk_ranking' | 'log_interpretation' | 'policy_review' | 'report_writing';
  difficulty: number;
  mode: PracticeMode;
  prompt: string;
  scenario: string;
  options?: unknown;
  correctAnswer?: unknown;
  rubric?: string[];
  explanation: string;
  hints: string[];
  commonWrongAnswerExplanation: string;
  relatedLessonSlug: string;
  relatedLabSlug?: string;
};

type Skill = {
  id: string;
  title: string;
  categoryId: string;
  categoryTitle: string;
  description: string;
  prerequisites: string[];
  lessonSlugs: string[];
  exerciseIds: string[];
  labSlugs: string[];
  portfolioArtifact?: string;
  trackSlug?: string;
  reviewCadenceDays: number;
};

export const skillCategories = [
  { id: 'cyber-foundations', title: 'Cyber Foundations', description: 'Safe defensive vocabulary, ethics, risk, and the CIA triad.', order: 1 },
  { id: 'identity-access', title: 'Identity and Access', description: 'Authentication, authorization, MFA, least privilege, and access reviews.', order: 2 },
  { id: 'networking-cybersecurity', title: 'Networking for Cybersecurity', description: 'IP, DNS, HTTP/S, ports, logs, and network-flow interpretation.', order: 3 },
  { id: 'blue-team-soc', title: 'Blue Team / SOC Foundations', description: 'Alerts, log analysis, triage, incident notes, escalation, and evidence handling.', order: 4 },
  { id: 'web-security-defense', title: 'Web Security Defense', description: 'Web app concepts, sessions, access control, input validation, remediation, and safe code review.', order: 5 },
  { id: 'cloud-iam-defense', title: 'Cloud and IAM Defense', description: 'Cloud basics, IAM roles, secrets, misconfiguration review, and least-privilege design.', order: 6 }
];

export const skillCatalog: Skill[] = [
  { id: 'cyber-what-is-cybersecurity', title: 'What is cybersecurity?', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Explain cybersecurity as authorized protection of people, systems, and data.', prerequisites: [], lessonSlugs: ['what-is-cybersecurity'], exerciseIds: ['ex-cyber-scope-1'], labSlugs: [], portfolioArtifact: 'Defensive learning pledge', trackSlug: 'cyber-foundations', reviewCadenceDays: 7 },
  { id: 'cyber-cia-triad', title: 'CIA Triad', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Classify confidentiality, integrity, and availability trade-offs in safe scenarios.', prerequisites: ['cyber-what-is-cybersecurity'], lessonSlugs: ['cia-triad'], exerciseIds: ['ex-cia-classify-1'], labSlugs: [], portfolioArtifact: 'CIA triad mini-analysis', trackSlug: 'cyber-foundations', reviewCadenceDays: 10 },
  { id: 'cyber-risk-basics', title: 'Assets, threats, vulnerabilities, and risk', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Separate assets, threats, vulnerabilities, impact, likelihood, and safe treatment.', prerequisites: ['cyber-cia-triad'], lessonSlugs: ['risk-assets-threats'], exerciseIds: ['ex-risk-ranking-1'], labSlugs: ['risk-register-review'], portfolioArtifact: 'Toy risk register', trackSlug: 'cyber-foundations', reviewCadenceDays: 10 },
  { id: 'iam-authentication', title: 'Authentication', categoryId: 'identity-access', categoryTitle: 'Identity and Access', description: 'Describe how accounts prove identity without collecting or testing real credentials.', prerequisites: ['cyber-what-is-cybersecurity'], lessonSlugs: ['identity-access-basics'], exerciseIds: ['ex-authn-authz-1'], labSlugs: ['password-policy-audit'], portfolioArtifact: 'Account safety checklist', trackSlug: 'identity-and-access', reviewCadenceDays: 10 },
  { id: 'iam-authorization', title: 'Authorization and least privilege', categoryId: 'identity-access', categoryTitle: 'Identity and Access', description: 'Decide what access is appropriate for fictional roles and document least-privilege changes.', prerequisites: ['iam-authentication'], lessonSlugs: ['identity-access-basics'], exerciseIds: ['ex-least-privilege-1'], labSlugs: ['demo-access-review', 'mock-cloud-iam-review'], portfolioArtifact: 'Access review memo', trackSlug: 'identity-and-access', reviewCadenceDays: 14 },
  { id: 'net-logs-flows', title: 'Logs and network flow interpretation', categoryId: 'networking-cybersecurity', categoryTitle: 'Networking for Cybersecurity', description: 'Read fictional logs, select evidence, and write safe triage notes.', prerequisites: ['cyber-risk-basics'], lessonSlugs: ['networking-fundamentals'], exerciseIds: ['ex-log-evidence-1'], labSlugs: ['log-analysis-auth-spikes'], portfolioArtifact: 'Network triage note', trackSlug: 'soc-analyst', reviewCadenceDays: 10 },
  { id: 'soc-alert-triage', title: 'SOC alert triage', categoryId: 'blue-team-soc', categoryTitle: 'Blue Team / SOC Foundations', description: 'Sort alert evidence, assumptions, severity, and escalation language.', prerequisites: ['net-logs-flows'], lessonSlugs: ['logging-siem-edr-incident-response'], exerciseIds: ['ex-alert-triage-1'], labSlugs: ['incident-triage-fake-edr'], portfolioArtifact: 'Incident triage summary', trackSlug: 'soc-analyst', reviewCadenceDays: 14 },
  { id: 'web-access-control', title: 'Web access control defense', categoryId: 'web-security-defense', categoryTitle: 'Web Security Defense', description: 'Review toy role boundaries and recommend safe authorization controls.', prerequisites: ['iam-authorization'], lessonSlugs: ['how-web-apps-work'], exerciseIds: ['ex-web-access-control-1'], labSlugs: ['secure-coding-toy-fix'], portfolioArtifact: 'Secure code review note', trackSlug: 'appsec', reviewCadenceDays: 14 },
  { id: 'cloud-iam-review', title: 'Cloud IAM review', categoryId: 'cloud-iam-defense', categoryTitle: 'Cloud and IAM Defense', description: 'Find excessive permissions in fictional cloud identities and scope them down safely.', prerequisites: ['iam-authorization'], lessonSlugs: ['cloud-basics-iam-secrets-containers'], exerciseIds: ['ex-cloud-iam-1'], labSlugs: ['mock-cloud-iam-review'], portfolioArtifact: 'Cloud IAM access review', trackSlug: 'cloud-security', reviewCadenceDays: 14 }
];

export const exerciseCatalog: Exercise[] = [
  { id: 'ex-cyber-scope-1', skillId: 'cyber-what-is-cybersecurity', type: 'multiple_choice', difficulty: 1, mode: 'practice', prompt: 'Which activity best fits CyberPath’s safe cybersecurity scope?', scenario: 'A beginner wants to learn responsibly.', options: ['Guessing a real account password', 'Reviewing fictional logs and writing a defensive note', 'Scanning a school network without approval', 'Sharing exploit steps for a live website'], correctAnswer: 'Reviewing fictional logs and writing a defensive note', explanation: 'CyberPath rewards authorized, defensive reasoning using fictional or explicitly approved data.', hints: ['Look for authorization and defensive intent.'], commonWrongAnswerExplanation: 'The unsafe options involve real targets, credentials, or unapproved testing.', relatedLessonSlug: 'what-is-cybersecurity' },
  { id: 'ex-cia-classify-1', skillId: 'cyber-cia-triad', type: 'matching', difficulty: 1, mode: 'practice', prompt: 'Match each situation to the CIA property it affects most.', scenario: 'A toy school portal has three incidents.', options: { confidentiality: 'private grades exposed', integrity: 'grades changed incorrectly', availability: 'portal offline during class' }, correctAnswer: { confidentiality: 'private grades exposed', integrity: 'grades changed incorrectly', availability: 'portal offline during class' }, explanation: 'Confidentiality is about exposure, integrity is about correctness, and availability is about reliable access.', hints: ['C = private, I = correct, A = accessible.'], commonWrongAnswerExplanation: 'Do not classify every problem as confidentiality; ask what changed first.', relatedLessonSlug: 'cia-triad' },
  { id: 'ex-risk-ranking-1', skillId: 'cyber-risk-basics', type: 'risk_ranking', difficulty: 2, mode: 'practice', prompt: 'Rank the highest beginner risk first.', scenario: 'A fictional club has weak backups, a typo in a poster, and shared admin passwords.', options: ['typo in public poster', 'shared admin passwords', 'old logo file'], correctAnswer: ['shared admin passwords', 'typo in public poster', 'old logo file'], explanation: 'Shared admin passwords combine high impact with higher likelihood and weak accountability.', hints: ['Rank by impact and likelihood, not annoyance.'], commonWrongAnswerExplanation: 'Cosmetic issues are rarely the top security risk.', relatedLessonSlug: 'risk-assets-threats', relatedLabSlug: 'risk-register-review' },
  { id: 'ex-authn-authz-1', skillId: 'iam-authentication', type: 'multiple_choice', difficulty: 1, mode: 'practice', prompt: 'What is authentication?', scenario: 'A fictional app is explaining sign-in.', options: ['Proving who a user is', 'Deciding what the user can do', 'Deleting inactive accounts', 'Encrypting backups'], correctAnswer: 'Proving who a user is', explanation: 'Authentication proves identity; authorization decides allowed actions.', hints: ['AuthN = identity. AuthZ = permission.'], commonWrongAnswerExplanation: 'Permissions are authorization, not authentication.', relatedLessonSlug: 'identity-access-basics' },
  { id: 'ex-least-privilege-1', skillId: 'iam-authorization', type: 'policy_review', difficulty: 2, mode: 'practice', prompt: 'Which access change is safest?', scenario: 'A fictional intern account has admin rights but only needs to read tickets.', options: ['Keep admin for convenience', 'Give read-only ticket access', 'Share another admin password', 'Disable MFA to reduce friction'], correctAnswer: 'Give read-only ticket access', explanation: 'Least privilege means granting only the access required for the role and task.', hints: ['Look for the narrowest useful permission.'], commonWrongAnswerExplanation: 'Convenience is not a justification for broad admin rights.', relatedLessonSlug: 'identity-access-basics', relatedLabSlug: 'demo-access-review' },
  { id: 'ex-log-evidence-1', skillId: 'net-logs-flows', type: 'evidence_selection', difficulty: 2, mode: 'review', prompt: 'Select the strongest evidence from the toy log.', scenario: '09:12 failed admin login from 198.51.100.8; 09:13 failed admin login from 198.51.100.8; 09:14 successful admin login from 198.51.100.8.', options: ['repeated failures then success for admin', 'the time uses minutes', 'admin has five letters', 'the IP is written with dots'], correctAnswer: 'repeated failures then success for admin', explanation: 'A pattern of repeated failures followed by success is useful triage evidence.', hints: ['Choose the evidence that changes risk.'], commonWrongAnswerExplanation: 'Format details are not risk evidence by themselves.', relatedLessonSlug: 'networking-fundamentals', relatedLabSlug: 'log-analysis-auth-spikes' },
  { id: 'ex-alert-triage-1', skillId: 'soc-alert-triage', type: 'scenario_classification', difficulty: 3, mode: 'mastery_challenge', prompt: 'What should the first triage note include?', scenario: 'A fictional EDR alert reports suspicious script execution.', options: ['Confirmed breach with no evidence', 'Host, user, timestamp, command line, and uncertainty', 'Instructions to attack back', 'Delete logs immediately'], correctAnswer: 'Host, user, timestamp, command line, and uncertainty', explanation: 'Good triage separates evidence from assumptions and preserves records.', hints: ['Document evidence and uncertainty.'], commonWrongAnswerExplanation: 'Overclaiming or destroying evidence is unsafe and unprofessional.', relatedLessonSlug: 'logging-siem-edr-incident-response', relatedLabSlug: 'incident-triage-fake-edr' },
  { id: 'ex-web-access-control-1', skillId: 'web-access-control', type: 'multiple_choice', difficulty: 3, mode: 'practice', prompt: 'What is the likely safe fix for the toy route?', scenario: "app.get('/admin', (req, res) => res.send(secretData))", options: ['Add an explicit authorization check before returning admin data', 'Hide the URL in the footer', 'Tell users not to visit it', 'Log all passwords'], correctAnswer: 'Add an explicit authorization check before returning admin data', explanation: 'Sensitive routes need server-side authorization checks, not obscurity or user promises.', hints: ['The server must enforce the rule.'], commonWrongAnswerExplanation: 'Hiding links does not prevent direct requests.', relatedLessonSlug: 'how-web-apps-work', relatedLabSlug: 'secure-coding-toy-fix' },
  { id: 'ex-cloud-iam-1', skillId: 'cloud-iam-review', type: 'policy_review', difficulty: 3, mode: 'lab_prep', prompt: 'Which cloud identity needs review first?', scenario: 'Fictional IAM list: intern-app=admin, billing-job=read-billing.', options: ['intern-app with admin', 'billing-job with read-billing', 'both are equally least-privilege', 'neither can be reviewed safely'], correctAnswer: 'intern-app with admin', explanation: 'A broad admin grant to a narrow-purpose identity creates unnecessary blast radius.', hints: ['Find the mismatch between role and permission.'], commonWrongAnswerExplanation: 'Specific read access can be appropriate; broad admin rights need justification.', relatedLessonSlug: 'cloud-basics-iam-secrets-containers', relatedLabSlug: 'mock-cloud-iam-review' }
];

function scoreToState(score: number, lastPracticedAt?: string | null, reviewCadenceDays = 14): MasteryState {
  if (score <= 0) return 'not_started';
  if (lastPracticedAt) {
    const ageDays = (Date.now() - new Date(lastPracticedAt).getTime()) / 86_400_000;
    if (ageDays > reviewCadenceDays && score >= 35) return 'needs_review';
  }
  if (score >= 80) return 'mastered';
  if (score >= 60) return 'proficient';
  if (score >= 40) return 'practiced';
  return 'introduced';
}

function addDaysIso(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function isExerciseCorrect(exercise: Exercise, answer: unknown) {
  if (exercise.type === 'multi_select' || exercise.type === 'risk_ranking') {
    return JSON.stringify([...(exercise.correctAnswer as unknown[] || [])].map(normalize)) === JSON.stringify([...(answer as unknown[] || [])].map(normalize));
  }
  if (exercise.type === 'matching') {
    return JSON.stringify(exercise.correctAnswer) === JSON.stringify(answer);
  }
  if (exercise.correctAnswer !== undefined) return normalize(exercise.correctAnswer) === normalize(answer);
  const text = normalize(answer);
  return (exercise.rubric ?? []).some((keyword) => text.includes(keyword.toLowerCase()));
}

function attemptsForSkill(userId: string, skillId: string) {
  return many<Record<string, unknown>>('SELECT * FROM skill_exercise_attempts WHERE user_id = ? AND skill_id = ? ORDER BY created_at DESC', userId, skillId);
}

function buildMasteryRecord(userId: string, skill: Skill) {
  const lessons = skill.lessonSlugs.map((slug) => one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE slug = ?', slug)).filter(Boolean);
  const lessonIds = lessons.map((lesson) => String(lesson!.id));
  const progress = lessonIds.length ? many<Record<string, unknown>>(`SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id IN (${lessonIds.map(() => '?').join(',')})`, userId, ...lessonIds) : [];
  const attempts = attemptsForSkill(userId, skill.id);
  const labRows = skill.labSlugs.map((slug) => one<Record<string, unknown> | null>('SELECT id FROM labs WHERE slug = ?', slug)).filter(Boolean);
  const labIds = labRows.map((lab) => String(lab!.id));
  const labAttempts = labIds.length ? many<Record<string, unknown>>(`SELECT * FROM lab_submissions WHERE user_id = ? AND lab_id IN (${labIds.map(() => '?').join(',')})`, userId, ...labIds) : [];
  const quizAttempts = lessonIds.length ? many<Record<string, unknown>>(`SELECT * FROM quiz_attempts WHERE user_id = ? AND lesson_id IN (${lessonIds.map(() => '?').join(',')})`, userId, ...lessonIds) : [];

  const lessonCompletion = lessonIds.length ? Math.round((progress.filter((item) => Number(item.completed ?? 0) === 1).length / lessonIds.length) * 100) : 0;
  const quizAccuracy = quizAttempts.length ? Math.round(quizAttempts.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / quizAttempts.length) : 0;
  const exercisePerformance = attempts.length ? Math.round((attempts.filter((item) => Number(item.is_correct ?? 0) === 1).length / attempts.length) * 100) : 0;
  const labScore = labAttempts.length ? Math.round(labAttempts.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / labAttempts.length) : 0;
  const reviewSuccessStreak = attempts.find((item) => Number(item.is_correct ?? 0) === 0) ? 0 : Math.min(5, attempts.length);
  const attemptDelta = attempts.reduce((sum, item) => sum + Number(item.score_delta ?? 0), 0);
  const base = Math.round((lessonCompletion * 0.28) + (quizAccuracy * 0.22) + (exercisePerformance * 0.28) + (labScore * 0.12) + (reviewSuccessStreak * 2));
  const score = Math.max(0, Math.min(100, base + attemptDelta));
  const lastPracticedAt = attempts[0]?.created_at ? String(attempts[0].created_at) : (progress[0]?.last_opened_at ? String(progress[0].last_opened_at) : null);
  const state = scoreToState(score, lastPracticedAt, skill.reviewCadenceDays);
  return {
    skillId: skill.id,
    score,
    state,
    confidence: Math.max(0, Math.min(100, score - (state === 'needs_review' ? 20 : 0) + Math.min(attempts.length * 4, 16))),
    lessonCompletion,
    quizAccuracy,
    exercisePerformance,
    labScore,
    reviewSuccessStreak,
    portfolioQuality: 0,
    lastPracticedAt,
    nextReviewAt: lastPracticedAt ? addDaysIso(skill.reviewCadenceDays) : null,
    history: attempts.slice(0, 8).map((item) => ({ at: String(item.created_at), score: Number(item.score_after ?? score), state: scoreToState(Number(item.score_after ?? score), String(item.created_at), skill.reviewCadenceDays), reason: String(item.mode) }))
  };
}

export function buildSkillTree(userId: string) {
  const nodes = skillCatalog.map((skill) => {
    const mastery = buildMasteryRecord(userId, skill);
    const lockedPrereq = skill.prerequisites.find((prereq) => !['practiced', 'proficient', 'mastered'].includes(buildMasteryRecord(userId, skillCatalog.find((item) => item.id === prereq) ?? skill).state));
    const lessons = skill.lessonSlugs.map((slug) => {
      const row = one<Record<string, unknown> | null>('SELECT * FROM lessons WHERE slug = ?', slug);
      if (!row) return null;
      const lesson = mapLesson(row);
      const progress = one<Record<string, unknown> | null>('SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', userId, lesson.id);
      return { id: lesson.id, slug: lesson.slug, title: lesson.title, completed: Number(progress?.completed ?? 0) === 1 };
    }).filter(Boolean);
    const labs = skill.labSlugs.map((slug) => {
      const row = one<Record<string, unknown> | null>('SELECT * FROM labs WHERE slug = ?', slug);
      if (!row) return null;
      const lab = mapLab(row);
      return { id: lab.id, slug: lab.slug, title: lab.title };
    }).filter(Boolean);
    return {
      ...skill,
      mastery,
      locked: Boolean(lockedPrereq),
      lockedReason: lockedPrereq ? `Practice prerequisite: ${skillCatalog.find((item) => item.id === lockedPrereq)?.title ?? lockedPrereq}` : null,
      recommended: false,
      lessons,
      exercises: exerciseCatalog.filter((exercise) => skill.exerciseIds.includes(exercise.id)),
      labs
    };
  }).filter((node) => node.lessons.length || node.exercises.length);
  const recommended = nodes.find((node) => !node.locked && node.mastery.state === 'needs_review') ?? nodes.find((node) => !node.locked && !['proficient', 'mastered'].includes(node.mastery.state)) ?? nodes[0] ?? null;
  nodes.forEach((node) => { node.recommended = node.id === recommended?.id; });
  const categories = skillCategories.map((category) => ({ ...category, nodes: nodes.filter((node) => node.categoryId === category.id) })).filter((category) => category.nodes.length);
  return { categories, recommendedNextSkill: recommended };
}

export function getMasterySummary(userId: string) {
  const { categories, recommendedNextSkill } = buildSkillTree(userId);
  const nodes = categories.flatMap((category) => category.nodes);
  const ranked = nodes.slice().sort((a, b) => a.mastery.score - b.mastery.score);
  const pathGroups = new Map<string, { completed: number; total: number }>();
  nodes.forEach((node) => {
    const key = node.trackSlug ?? 'cyber-foundations';
    const value = pathGroups.get(key) ?? { completed: 0, total: 0 };
    value.total += 1;
    if (['proficient', 'mastered'].includes(node.mastery.state)) value.completed += 1;
    pathGroups.set(key, value);
  });
  return {
    records: nodes.map((node) => node.mastery),
    weakestSkills: ranked.filter((node) => node.mastery.state !== 'not_started').slice(0, 5),
    strongestSkills: ranked.slice().reverse().filter((node) => node.mastery.score > 0).slice(0, 5),
    needsReview: nodes.filter((node) => node.mastery.state === 'needs_review'),
    recommendedNextSkill,
    pathProgress: Array.from(pathGroups.entries()).map(([trackSlug, value]) => ({ trackSlug, ...value, percent: value.total ? Math.round((value.completed / value.total) * 100) : 0 }))
  };
}

export function getPracticeSession(userId: string, input: { mode?: PracticeMode; skillId?: string | null }) {
  const mode = input.mode ?? 'practice';
  const { categories, recommendedNextSkill } = buildSkillTree(userId);
  const nodes = categories.flatMap((category) => category.nodes);
  const skillNode = (input.skillId ? nodes.find((node) => node.id === input.skillId) : null) ?? recommendedNextSkill ?? nodes[0];
  if (!skillNode) return null;
  const exercises = exerciseCatalog.filter((exercise) => exercise.skillId === skillNode.id && (mode === 'practice' || exercise.mode === mode || exercise.mode === 'practice')).slice(0, 4);
  return { id: makeId(), mode, skillId: skillNode.id, skillTitle: skillNode.title, exercises: exercises.length ? exercises : skillNode.exercises, masteryBefore: skillNode.mastery };
}

export function submitPracticeAnswer(userId: string, input: { exerciseId: string; answer: unknown; mode?: PracticeMode }) {
  const exercise = exerciseCatalog.find((item) => item.id === input.exerciseId);
  if (!exercise) return null;
  const skill = skillCatalog.find((item) => item.id === exercise.skillId)!;
  const isCorrect = isExerciseCorrect(exercise, input.answer);
  const mode = input.mode ?? 'practice';
  const before = buildMasteryRecord(userId, skill);
  const scoreDelta = isCorrect ? (mode === 'mastery_challenge' ? 12 : mode === 'review' ? 8 : 6) : (mode === 'mastery_challenge' ? -5 : -2);
  const scoreAfter = Math.max(0, Math.min(100, before.score + scoreDelta));
  const id = makeId();
  const timestamp = nowIso();
  run(
    `INSERT INTO skill_exercise_attempts (id, user_id, skill_id, exercise_id, mode, is_correct, score_delta, score_after, answer_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    exercise.skillId,
    exercise.id,
    mode,
    isCorrect ? 1 : 0,
    scoreDelta,
    scoreAfter,
    toDbJson(input.answer),
    timestamp
  );

  upsertReviewItem({
    userId,
    sourceType: 'exercise',
    sourceId: exercise.id,
    topic: skill.title,
    subtopic: exercise.type,
    prompt: exercise.prompt,
    success: isCorrect
  });

  if (!isCorrect) {
    const existing = one<Record<string, unknown> | null>('SELECT * FROM mistakes WHERE user_id = ? AND question_id = ?', userId, exercise.id);
    if (existing) {
      run('UPDATE mistakes SET repeat_count = repeat_count + 1, last_seen_at = ?, user_answer = ?, correct_answer = ? WHERE id = ?', timestamp, toDbJson(input.answer), toDbJson(exercise.correctAnswer ?? exercise.rubric), String(existing.id));
    } else {
      run(
        `INSERT INTO mistakes (id, user_id, lesson_id, question_id, topic, subtopic, prompt, explanation, user_answer, correct_answer, notes, repeat_count, last_seen_at, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        makeId(),
        userId,
        exercise.id,
        skill.title,
        exercise.type,
        exercise.prompt,
        exercise.explanation,
        toDbJson(input.answer),
        toDbJson(exercise.correctAnswer ?? exercise.rubric),
        'Created by adaptive practice engine.',
        timestamp,
        timestamp
      );
    }
  }

  return {
    isCorrect,
    scoreDelta,
    updatedMastery: buildMasteryRecord(userId, skill),
    explanation: exercise.explanation,
    wrongAnswerReason: isCorrect ? undefined : exercise.commonWrongAnswerExplanation,
    missedConcept: isCorrect ? undefined : skill.title,
    reviewRecommendation: isCorrect ? 'Keep going or try the mastery challenge.' : 'Review the related lesson, then retry a similar safe scenario.',
    retryExercise: isCorrect ? undefined : exerciseCatalog.find((item) => item.skillId === exercise.skillId && item.id !== exercise.id),
    relatedLessonSlug: exercise.relatedLessonSlug
  };
}

export function getSkillReviewSets(userId: string) {
  const { categories } = buildSkillTree(userId);
  const nodes = categories.flatMap((category) => category.nodes);
  const reviewSkills = nodes.filter((node) => ['needs_review', 'introduced', 'practiced'].includes(node.mastery.state)).slice(0, 5);
  return reviewSkills.map((skill) => ({ skill, exercises: exerciseCatalog.filter((exercise) => exercise.skillId === skill.id).slice(0, 2) }));
}
