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
  { id: 'linux-systems', title: 'Linux and Systems Basics', description: 'Files, permissions, processes, users, groups, command line, and logs.', order: 4 },
  { id: 'blue-team-soc', title: 'Blue Team / SOC Foundations', description: 'Alerts, log analysis, triage, incident notes, escalation, and evidence handling.', order: 5 },
  { id: 'web-security-defense', title: 'Web Security Defense', description: 'Web app concepts, sessions, access control, input validation, remediation, and safe code review.', order: 6 },
  { id: 'cloud-iam-defense', title: 'Cloud and IAM Defense', description: 'Cloud basics, IAM roles, secrets, misconfiguration review, and least-privilege design.', order: 7 },
  { id: 'grc-risk', title: 'GRC and Risk', description: 'Risk registers, control mapping, privacy, continuity, and executive summaries.', order: 8 },
  { id: 'ai-security-awareness', title: 'AI Security Awareness', description: 'Safe AI use, private-data boundaries, prompt safety, limitations, and classroom rules.', order: 9 }
];

export const skillCatalog: Skill[] = [
  { id: 'cyber-what-is-cybersecurity', title: 'What is cybersecurity?', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Explain cybersecurity as authorized protection of people, systems, and data.', prerequisites: [], lessonSlugs: ['what-is-cybersecurity'], exerciseIds: ['ex-cyber-scope-1'], labSlugs: [], portfolioArtifact: 'Defensive learning pledge', trackSlug: 'cyber-foundations', reviewCadenceDays: 7 },
  { id: 'cyber-cia-triad', title: 'CIA Triad', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Classify confidentiality, integrity, and availability trade-offs in safe scenarios.', prerequisites: ['cyber-what-is-cybersecurity'], lessonSlugs: ['cia-triad'], exerciseIds: ['ex-cia-classify-1'], labSlugs: ['digital-safety-home-audit'], portfolioArtifact: 'CIA triad mini-analysis', trackSlug: 'cyber-foundations', reviewCadenceDays: 10 },
  { id: 'cyber-risk-basics', title: 'Assets, threats, vulnerabilities, and risk', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Separate assets, threats, vulnerabilities, impact, likelihood, and safe treatment.', prerequisites: ['cyber-cia-triad'], lessonSlugs: ['risk-assets-threats'], exerciseIds: ['ex-risk-ranking-1'], labSlugs: ['risk-register-review'], portfolioArtifact: 'Toy risk register', trackSlug: 'cyber-foundations', reviewCadenceDays: 10 },
  { id: 'cyber-ethics-authorization', title: 'Ethics and authorization', categoryId: 'cyber-foundations', categoryTitle: 'Cyber Foundations', description: 'Apply authorization boundaries and refuse real-target or harmful activity.', prerequisites: ['cyber-what-is-cybersecurity'], lessonSlugs: ['what-is-cybersecurity'], exerciseIds: ['ex-ethics-boundary-1'], labSlugs: [], portfolioArtifact: 'Authorization checklist', trackSlug: 'cyber-foundations', reviewCadenceDays: 14 },
  { id: 'iam-authentication', title: 'Authentication', categoryId: 'identity-access', categoryTitle: 'Identity and Access', description: 'Describe how accounts prove identity without collecting or testing real credentials.', prerequisites: ['cyber-ethics-authorization'], lessonSlugs: ['identity-access-basics'], exerciseIds: ['ex-authn-authz-1'], labSlugs: ['password-policy-audit'], portfolioArtifact: 'Account safety checklist', trackSlug: 'identity-and-access', reviewCadenceDays: 10 },
  { id: 'iam-authorization', title: 'Authorization and least privilege', categoryId: 'identity-access', categoryTitle: 'Identity and Access', description: 'Decide what access is appropriate for fictional roles and document least-privilege changes.', prerequisites: ['iam-authentication'], lessonSlugs: ['identity-access-basics'], exerciseIds: ['ex-least-privilege-1'], labSlugs: ['access-control-review', 'mock-cloud-iam-review'], portfolioArtifact: 'Access review memo', trackSlug: 'identity-and-access', reviewCadenceDays: 14 },
  { id: 'iam-mfa-passwords', title: 'MFA and password security', categoryId: 'identity-access', categoryTitle: 'Identity and Access', description: 'Recommend safe password and MFA policy improvements for fictional organizations.', prerequisites: ['iam-authentication'], lessonSlugs: ['passwords-mfa-and-phishing'], exerciseIds: ['ex-mfa-policy-1'], labSlugs: ['password-policy-audit'], portfolioArtifact: 'Password policy audit memo', trackSlug: 'identity-and-access', reviewCadenceDays: 14 },
  { id: 'net-ip-dns-http', title: 'IP, DNS, and HTTP/HTTPS basics', categoryId: 'networking-cybersecurity', categoryTitle: 'Networking for Cybersecurity', description: 'Interpret toy network records and identify defensive observations.', prerequisites: ['cyber-risk-basics'], lessonSlugs: ['networking-fundamentals'], exerciseIds: ['ex-dns-http-log-1'], labSlugs: ['network-log-triage'], portfolioArtifact: 'Network observation note', trackSlug: 'soc-analyst', reviewCadenceDays: 10 },
  { id: 'net-logs-flows', title: 'Logs and network flow interpretation', categoryId: 'networking-cybersecurity', categoryTitle: 'Networking for Cybersecurity', description: 'Read fictional logs, select evidence, and write safe triage notes.', prerequisites: ['net-ip-dns-http'], lessonSlugs: ['networking-fundamentals'], exerciseIds: ['ex-log-evidence-1'], labSlugs: ['network-log-triage'], portfolioArtifact: 'Log triage note', trackSlug: 'soc-analyst', reviewCadenceDays: 7 },
  { id: 'linux-files-permissions', title: 'Files, permissions, users, and groups', categoryId: 'linux-systems', categoryTitle: 'Linux and Systems Basics', description: 'Explain safe permission concepts using toy examples and defensive reasoning.', prerequisites: ['cyber-ethics-authorization'], lessonSlugs: ['operating-systems-and-files', 'linux-windows-basics'], exerciseIds: ['ex-linux-permissions-1'], labSlugs: ['linux-permissions-detective'], portfolioArtifact: 'Permissions explanation card', trackSlug: 'security-engineering', reviewCadenceDays: 14 },
  { id: 'soc-alert-triage', title: 'Alerts, triage, and incident notes', categoryId: 'blue-team-soc', categoryTitle: 'Blue Team / SOC Foundations', description: 'Classify fictional alerts, pick evidence, and write escalation-ready notes.', prerequisites: ['net-logs-flows'], lessonSlugs: ['soc-alert-triage'], exerciseIds: ['ex-alert-triage-1'], labSlugs: ['first-soc-alert-triage'], portfolioArtifact: 'Incident triage note', trackSlug: 'soc-analyst', reviewCadenceDays: 7 },
  { id: 'web-access-input-defense', title: 'Access control and input validation defense', categoryId: 'web-security-defense', categoryTitle: 'Web Security Defense', description: 'Review toy app behavior and recommend defensive remediation without exploit steps.', prerequisites: ['iam-authorization'], lessonSlugs: ['browser-and-web-basics', 'web-security-defense'], exerciseIds: ['ex-web-remediation-1'], labSlugs: ['safe-code-review'], portfolioArtifact: 'Secure remediation memo', trackSlug: 'application-security', reviewCadenceDays: 14 },
  { id: 'cloud-iam-roles', title: 'Cloud IAM roles and secrets', categoryId: 'cloud-iam-defense', categoryTitle: 'Cloud and IAM Defense', description: 'Spot fictional over-permissioning and secret-handling risks, then scope safer roles.', prerequisites: ['iam-authorization'], lessonSlugs: ['cloud-iam-basics'], exerciseIds: ['ex-cloud-iam-1'], labSlugs: ['mock-cloud-iam-review'], portfolioArtifact: 'Cloud IAM review memo', trackSlug: 'cloud-security', reviewCadenceDays: 14 },
  { id: 'grc-risk-registers', title: 'Risk registers and executive summaries', categoryId: 'grc-risk', categoryTitle: 'GRC and Risk', description: 'Prioritize fictional risks and communicate defensible actions to non-technical stakeholders.', prerequisites: ['cyber-risk-basics'], lessonSlugs: ['risk-registers-and-controls'], exerciseIds: ['ex-exec-summary-1'], labSlugs: ['risk-register-review'], portfolioArtifact: 'Executive risk summary', trackSlug: 'grc-risk', reviewCadenceDays: 21 },
  { id: 'ai-safe-use-boundaries', title: 'Safe AI use and private-data boundaries', categoryId: 'ai-security-awareness', categoryTitle: 'AI Security Awareness', description: 'Classify acceptable classroom AI use while protecting privacy and authorization boundaries.', prerequisites: ['cyber-ethics-authorization'], lessonSlugs: ['ai-security-awareness'], exerciseIds: ['ex-ai-boundary-1'], labSlugs: ['ai-security-awareness-scenario'], portfolioArtifact: 'Classroom AI rules summary', trackSlug: 'ai-security-awareness', reviewCadenceDays: 14 }
];

export const exerciseCatalog: Exercise[] = [
  { id: 'ex-cyber-scope-1', skillId: 'cyber-what-is-cybersecurity', type: 'multiple_choice', difficulty: 1, mode: 'learn', prompt: 'Which answer best describes safe cybersecurity learning?', scenario: 'A student cyber club is starting its first week.', options: ['Protect systems with authorization and fictional practice data', 'Try techniques against random websites', 'Collect classmates’ passwords to test strength', 'Bypass school controls to learn faster'], correctAnswer: 'Protect systems with authorization and fictional practice data', explanation: 'CyberPath practice is defensive-only, authorized, and uses toy or fictional data.', hints: ['Look for authorization.', 'Avoid real targets and private data.'], commonWrongAnswerExplanation: 'Anything involving real targets, passwords, or bypassing systems is outside the safety boundary.', relatedLessonSlug: 'what-is-cybersecurity' },
  { id: 'ex-cia-classify-1', skillId: 'cyber-cia-triad', type: 'scenario_classification', difficulty: 1, mode: 'practice', prompt: 'A fictional class grade file is changed accidentally. Which CIA triad area is most affected?', scenario: 'No real student data is used; this is a toy example.', options: ['Confidentiality', 'Integrity', 'Availability'], correctAnswer: 'Integrity', explanation: 'Integrity means information remains accurate and unaltered except through approved changes.', hints: ['Think accuracy.', 'Which part changes when data is incorrect?'], commonWrongAnswerExplanation: 'Confidentiality is about unwanted disclosure; availability is about access when needed.', relatedLessonSlug: 'cia-triad', relatedLabSlug: 'digital-safety-home-audit' },
  { id: 'ex-risk-ranking-1', skillId: 'cyber-risk-basics', type: 'risk_ranking', difficulty: 2, mode: 'practice', prompt: 'Rank the fictional risks by what the school should address first.', scenario: 'Toy pilot risks: missing parent safety note, unlabeled external links, typo in club flyer.', options: ['Missing parent safety note', 'Unlabeled external links', 'Typo in club flyer'], correctAnswer: ['Missing parent safety note', 'Unlabeled external links', 'Typo in club flyer'], explanation: 'Safety communication and unsafe external-link ambiguity create higher learner risk than a typo.', hints: ['Prioritize student safety and likelihood.', 'Communication gaps can create real confusion.'], commonWrongAnswerExplanation: 'Cosmetic issues matter less than safety and authorization clarity.', relatedLessonSlug: 'risk-assets-threats', relatedLabSlug: 'risk-register-review' },
  { id: 'ex-ethics-boundary-1', skillId: 'cyber-ethics-authorization', type: 'true_false', difficulty: 1, mode: 'review', prompt: 'True or false: It is acceptable to practice only in labs, toy examples, or systems where you have explicit authorization.', scenario: 'A learner wants a simple rule for practice boundaries.', options: ['true', 'false'], correctAnswer: 'true', explanation: 'CyberPath requires explicit authorization and safe fictional environments.', hints: ['The key phrase is explicit authorization.', 'Safe labs are intentionally scoped.'], commonWrongAnswerExplanation: 'Curiosity never replaces authorization.', relatedLessonSlug: 'what-is-cybersecurity' },
  { id: 'ex-authn-authz-1', skillId: 'iam-authentication', type: 'matching', difficulty: 1, mode: 'learn', prompt: 'Match each identity concept to its meaning.', scenario: 'A fictional club app is being explained to beginners.', options: ['Authentication', 'Authorization'], correctAnswer: { Authentication: 'Proves who you are', Authorization: 'Decides what you can access' }, explanation: 'Authentication verifies identity; authorization grants appropriate permissions after identity is known.', hints: ['AuthN asks who.', 'AuthZ asks allowed to do what.'], commonWrongAnswerExplanation: 'These terms are related but not interchangeable.', relatedLessonSlug: 'identity-access-basics' },
  { id: 'ex-least-privilege-1', skillId: 'iam-authorization', type: 'evidence_selection', difficulty: 2, mode: 'practice', prompt: 'Which evidence best supports reducing access?', scenario: 'Fictional account: newsletter-helper has admin role but only sends weekly emails.', options: ['Admin role assigned', 'Only sends weekly emails', 'Account name includes helper', 'Uses the club logo'], correctAnswer: ['Admin role assigned', 'Only sends weekly emails'], explanation: 'The evidence shows a mismatch between broad permissions and a narrow job need.', hints: ['Compare job need to permission.', 'Least privilege is about enough access, not maximum access.'], commonWrongAnswerExplanation: 'Names and logos do not prove access risk by themselves.', relatedLessonSlug: 'identity-access-basics', relatedLabSlug: 'access-control-review' },
  { id: 'ex-mfa-policy-1', skillId: 'iam-mfa-passwords', type: 'policy_review', difficulty: 2, mode: 'lab_prep', prompt: 'Choose the best defensive recommendation for a staff account policy.', scenario: 'Fictional policy says MFA is optional for mentors who can view student progress.', options: ['Require MFA for mentor/admin accounts', 'Ask students to share backup codes', 'Disable all password resets', 'Use one shared mentor account'], correctAnswer: 'Require MFA for mentor/admin accounts', explanation: 'Privileged accounts should use MFA; shared secrets or shared accounts create accountability and safety problems.', hints: ['Look for a practical safer control.', 'Never share backup codes.'], commonWrongAnswerExplanation: 'Shared access and secret sharing weaken accountability.', relatedLessonSlug: 'passwords-mfa-and-phishing', relatedLabSlug: 'password-policy-audit' },
  { id: 'ex-dns-http-log-1', skillId: 'net-ip-dns-http', type: 'log_interpretation', difficulty: 2, mode: 'learn', prompt: 'What does this toy log most directly show: GET /login 200 from 10.0.0.5?', scenario: 'Fictional local training log, not a real system.', options: ['A web request returned success', 'A password was stolen', 'A server was bypassed', 'Malware persistence was installed'], correctAnswer: 'A web request returned success', explanation: 'A 200 response means the request succeeded; the log alone does not prove theft, bypass, or malware.', hints: ['Interpret only what the evidence supports.', 'Avoid overclaiming.'], commonWrongAnswerExplanation: 'Defensive analysis should not claim incidents beyond the available evidence.', relatedLessonSlug: 'networking-fundamentals', relatedLabSlug: 'network-log-triage' },
  { id: 'ex-log-evidence-1', skillId: 'net-logs-flows', type: 'evidence_selection', difficulty: 2, mode: 'practice', prompt: 'Select the evidence that belongs in a triage note.', scenario: 'Toy DNS logs show repeated requests to updates.example.test from one classroom device.', options: ['Timestamp', 'Source device id', 'Domain requested', 'A guess about the student’s intent'], correctAnswer: ['Timestamp', 'Source device id', 'Domain requested'], explanation: 'Good notes include observable evidence and avoid unsupported claims about intent.', hints: ['Pick facts from the log.', 'Do not guess motive.'], commonWrongAnswerExplanation: 'Intent requires more evidence and should be phrased carefully.', relatedLessonSlug: 'networking-fundamentals', relatedLabSlug: 'network-log-triage' },
  { id: 'ex-linux-permissions-1', skillId: 'linux-files-permissions', type: 'multiple_choice', difficulty: 2, mode: 'practice', prompt: 'A toy file is readable by everyone but only mentors should read it. What is the defensive issue?', scenario: 'Fictional file permissions example.', options: ['Excessive read permission', 'A DNS issue', 'An availability improvement', 'A password reset problem'], correctAnswer: 'Excessive read permission', explanation: 'Permissions should match the people and roles that need access.', hints: ['Look at who can read.', 'Compare actual access to required access.'], commonWrongAnswerExplanation: 'This is about file access, not networking or password reset.', relatedLessonSlug: 'operating-systems-and-files', relatedLabSlug: 'linux-permissions-detective' },
  { id: 'ex-alert-triage-1', skillId: 'soc-alert-triage', type: 'report_writing', difficulty: 3, mode: 'mastery_challenge', prompt: 'Write a three-sentence triage note with evidence, risk, and safe next step.', scenario: 'Fictional alert: five failed logins then one success for demo-user from a new city in a toy dataset.', rubric: ['mentions failed logins and success', 'states uncertainty', 'recommends authorized account review/MFA check'], correctAnswer: 'Evidence-based note with uncertainty and authorized review.', explanation: 'A strong triage note separates evidence from interpretation and recommends safe authorized review.', hints: ['Sentence 1 evidence, sentence 2 risk, sentence 3 next step.', 'Do not claim compromise without proof.'], commonWrongAnswerExplanation: 'Overconfident claims and intrusive actions are not appropriate from limited evidence.', relatedLessonSlug: 'soc-alert-triage', relatedLabSlug: 'first-soc-alert-triage' },
  { id: 'ex-web-remediation-1', skillId: 'web-access-input-defense', type: 'short_answer', difficulty: 3, mode: 'practice', prompt: 'Name one safe remediation for a toy form that accepts unexpected characters and displays confusing errors.', scenario: 'Toy code review scenario; no exploit steps or real target.', correctAnswer: 'validate input', explanation: 'Input validation and clear server-side checks are defensive remediations.', hints: ['Focus on fixing, not exploiting.', 'The phrase input validation is enough.'], commonWrongAnswerExplanation: 'Defensive code review should recommend controls, tests, and clear errors, not attack steps.', relatedLessonSlug: 'web-security-defense', relatedLabSlug: 'safe-code-review' },
  { id: 'ex-cloud-iam-1', skillId: 'cloud-iam-roles', type: 'multi_select', difficulty: 3, mode: 'practice', prompt: 'Which changes improve a fictional cloud role safely?', scenario: 'Toy cloud account: report-generator has admin rights but only reads monthly billing summaries.', options: ['Replace admin with read-only billing scope', 'Document owner and review date', 'Store real keys in a class chat', 'Keep admin because it is convenient'], correctAnswer: ['Replace admin with read-only billing scope', 'Document owner and review date'], explanation: 'Least privilege and periodic review reduce risk without handling real secrets.', hints: ['Select all safe improvements.', 'Never share real keys.'], commonWrongAnswerExplanation: 'Convenience and secret sharing are not defensible security controls.', relatedLessonSlug: 'cloud-iam-basics', relatedLabSlug: 'mock-cloud-iam-review' },
  { id: 'ex-exec-summary-1', skillId: 'grc-risk-registers', type: 'report_writing', difficulty: 2, mode: 'practice', prompt: 'Write one executive-summary sentence for a fictional high-impact classroom safety risk.', scenario: 'Toy school pilot risk register.', rubric: ['plain language', 'risk impact', 'owner or next action'], correctAnswer: 'Plain-language risk sentence with owner and action.', explanation: 'Executives need concise risk, impact, and ownership, not technical jargon.', hints: ['Use plain language.', 'Include who should act.'], commonWrongAnswerExplanation: 'A summary without action is hard for leaders to use.', relatedLessonSlug: 'risk-registers-and-controls', relatedLabSlug: 'risk-register-review' },
  { id: 'ex-ai-boundary-1', skillId: 'ai-safe-use-boundaries', type: 'scenario_classification', difficulty: 1, mode: 'review', prompt: 'Which AI use is safe in CyberPath?', scenario: 'Classroom AI rules practice.', options: ['Ask for a glossary explanation using fictional data', 'Paste a classmate email into a prompt', 'Ask for steps against a real website', 'Upload private school records'], correctAnswer: 'Ask for a glossary explanation using fictional data', explanation: 'Safe AI use avoids private data, real targets, and harmful operational steps.', hints: ['Look for fictional data.', 'Private data stays out of prompts.'], commonWrongAnswerExplanation: 'Real personal data and real-target instructions are outside the platform safety model.', relatedLessonSlug: 'ai-security-awareness', relatedLabSlug: 'ai-security-awareness-scenario' }
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
