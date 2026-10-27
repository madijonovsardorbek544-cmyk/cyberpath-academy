import { z } from 'zod';

export const roleSchema = z.enum(['student', 'mentor', 'admin']);
export const strongPasswordSchema = z.string().min(10).max(128)
  .regex(/[A-Z]/, 'Use at least one uppercase letter.')
  .regex(/[a-z]/, 'Use at least one lowercase letter.')
  .regex(/[0-9]/, 'Use at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Use at least one symbol.');

export const roadmapSchema = z.object({
  goal: z.string(),
  experienceLevel: z.string(),
  score: z.number(),
  pace: z.string(),
  modules: z.array(z.object({ week: z.number(), title: z.string(), focus: z.string(), successMetric: z.string() })),
  advice: z.array(z.string()),
  specializationReady: z.boolean()
});

export const userSchema = z.object({
  id: z.string(), name: z.string(), email: z.string(), role: roleSchema,
  goal: z.string().nullable().optional(), experienceLevel: z.string().nullable().optional(), placementScore: z.number().nullable().optional(),
  roadmapJson: roadmapSchema.nullable().optional(), streakDays: z.number().optional(), createdAt: z.string().optional(), updatedAt: z.string().optional()
});

export const trackSchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), level: z.string(), description: z.string(), frameworkRef: z.string(),
  trackType: z.string().optional(), estimatedHours: z.number().optional(), hero: z.string().optional(), outcomes: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()), skills: z.array(z.string()), milestones: z.array(z.string()), entryPoints: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(), recommendedFor: z.array(z.string()).optional(), lessonCount: z.number().optional(),
  recommendedLessonId: z.string().optional(), recommendedLessonSlug: z.string().optional(), recommendedLessonTitle: z.string().optional(),
  competencies: z.array(z.object({ lessonId: z.string(), competency: z.string(), weight: z.number() })).optional(),
  lessonLinks: z.array(z.object({ lessonId: z.string(), lessonSlug: z.string().optional(), lessonTitle: z.string().optional(), competency: z.string(), weight: z.number() })).optional()
});

export const quizQuestionTypeSchema = z.enum(['multiple-choice', 'multi-select', 'true-false', 'matching', 'short-response', 'scenario']);
export const quizQuestionSchema = z.object({
  id: z.string(), lessonId: z.string(), prompt: z.string(), type: quizQuestionTypeSchema, difficulty: z.string(), topic: z.string(), subtopic: z.string(), explanation: z.string(),
  scenarioContext: z.string().nullable().optional(), options: z.any(), answer: z.any()
});

export const lessonSchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), phase: z.number(), phaseTitle: z.string(), level: z.string(), orderIndex: z.number(),
  specialization: z.string().nullable().optional(), estimatedMinutes: z.number(), learningObjectives: z.array(z.string()), content: z.string(),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })), examples: z.array(z.string()), knowledgeChecks: z.array(z.string()),
  commonMistakes: z.string(), whyItMatters: z.string(), icon: z.string().optional(), version: z.number().optional(), lastReviewedAt: z.string().nullable().optional(),
  reviewDueAt: z.string().nullable().optional(), reviewedBy: z.string().nullable().optional(), revisionCount: z.number().optional(),
  relatedTracks: z.array(trackSchema).optional(), completed: z.boolean().optional(), timeSpentMinutes: z.number().optional(), quizQuestions: z.array(quizQuestionSchema).optional(),
  contentLocale: z.enum(['en', 'uz', 'ru']).optional()
});

export const lessonInputSchema = lessonSchema.omit({ id: true, estimatedMinutes: true }).extend({
  slug: z.string().trim().min(3).max(120), title: z.string().trim().min(3).max(160), phase: z.number().int().min(1).max(5),
  phaseTitle: z.string().trim().min(3).max(120), level: z.string().trim().min(3).max(80), orderIndex: z.number().int().min(1),
  specialization: z.string().trim().min(2).max(120).optional().nullable(), learningObjectives: z.array(z.string().min(2)).min(1), content: z.string().min(20),
  glossary: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })), examples: z.array(z.string().min(2)).min(1),
  knowledgeChecks: z.array(z.string().min(2)).min(1), commonMistakes: z.string().min(10), whyItMatters: z.string().min(10), estimatedMinutes: z.number().int().min(5).max(240).optional(), icon: z.string().min(2).max(40).optional()
}).omit({ relatedTracks: true, completed: true, timeSpentMinutes: true, quizQuestions: true, version: true, lastReviewedAt: true, reviewDueAt: true, reviewedBy: true, revisionCount: true });
export const lessonPatchSchema = lessonInputSchema.partial().extend({ changeSummary: z.string().min(4).max(280).optional(), reviewDueAt: z.string().datetime().optional().nullable(), lastReviewedAt: z.string().datetime().optional().nullable() });

export const labTaskSchema = z.object({ id: z.string(), prompt: z.string(), expectedKeywords: z.array(z.string()).optional(), expectedEvidence: z.array(z.string()).optional(), hints: z.array(z.string()).optional() });
export const labSchema = z.object({
  id: z.string(), slug: z.string(), title: z.string(), category: z.string(), difficulty: z.string(), description: z.string(), scenarioBriefing: z.string().optional(),
  fictionalDatasetLabel: z.string().optional(), evidenceChecklist: z.array(z.string()).optional(), artifactSuggestion: z.object({ type: z.string(), title: z.string(), prompt: z.string() }).optional(),
  dataset: z.any(), tasks: z.array(labTaskSchema), safeGuardrails: z.string(), solutionOutline: z.string(), locked: z.boolean().optional(), lockedMessage: z.string().nullable().optional(), rubric: z.record(z.string(), z.unknown()).optional(), hints: z.array(z.string()).optional()
});
export const labInputSchema = z.object({
  slug: z.string().trim().min(3).max(120), title: z.string().trim().min(3).max(160), category: z.string().trim().min(3).max(80), difficulty: z.string().trim().min(3).max(80),
  description: z.string().min(20), dataset: z.any(), tasks: z.array(labTaskSchema.extend({ id: z.string().min(2), prompt: z.string().min(2), expectedKeywords: z.array(z.string().min(1)).min(1).optional(), expectedEvidence: z.array(z.string().min(1)).min(1).optional(), hints: z.array(z.string().min(1)).optional() })).min(1),
  accessTier: z.enum(['free', 'premium', 'school']).optional(), safeGuardrails: z.string().min(10), solutionOutline: z.string().min(10)
});
export const labPatchSchema = labInputSchema.partial();

export const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email(), password: strongPasswordSchema });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
export const requestResetSchema = z.object({ email: z.string().email() });
export const resetSchema = z.object({ token: z.string().min(10), password: strongPasswordSchema });
export const onboardingSchema = z.object({ goal: z.string().min(2).max(80), experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']), score: z.number().min(0).max(100) });
export const lessonCompleteSchema = z.object({ completed: z.boolean(), timeSpentMinutes: z.number().min(0).max(1000) });
export const quizSubmitSchema = z.object({ lessonId: z.string().min(2), answers: z.record(z.string(), z.any()), timeSpentMinutes: z.number().min(0).max(1000).default(0) });
export const labSubmitSchema = z.object({ answers: z.record(z.string(), z.any()) });
export const sessionSchema = z.object({ minutes: z.number().min(1).max(240), lessonId: z.string().optional() });
export const feedbackSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), category: z.enum(['bug', 'content', 'feature', 'billing', 'support', 'validation', 'waitlist']), message: z.string().min(10).max(2000) });

export type Role = z.infer<typeof roleSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type User = z.infer<typeof userSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Lab = z.infer<typeof labSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type QuizResult = { score: number; correct: number; total: number; difficulty: string; topicScores: Record<string, number>; review: { id: string; prompt: string; type: string; explanation: string; yourAnswer: any; correctAnswer: any; isCorrect: boolean }[] };
export type Analytics = { totalCompleted: number; completionRate: number; totalQuizAccuracy: number; weakTopics: { topic: string; misses: number }[]; topicAccuracy: { topic: string; accuracy: number }[]; timeStudied: number; streakDays: number; milestones: { label: string; done: boolean }[]; readiness: { specialization: number; capstone: number }; skillRadar: { skill: string; value: number }[] };
export type Mastery = { trackSlug: string; title: string; frameworkRef: string; trackType?: string; estimatedHours?: number; hero?: string; score: number; quizAverage: number; completionRate: number; status: string; band: string; evidence: string[]; nextMilestone: string; milestones?: string[]; skills?: string[]; skillSignals?: { skill: string; score: number; state: string }[]; reviewDueCount?: number; reviewHealth?: number; confidence?: number; evidenceCount?: number; lessonCount?: number; entryPoints?: string[]; prerequisites?: string[]; recommendedFor?: string[] };
export type Recommendation = { id: string; title: string; reason: string; actionType: 'lesson' | 'lab' | 'quiz' | 'portfolio'; actionTarget: string; priority: 'high' | 'medium' | 'low' };
export type Mistake = { id: string; topic: string; subtopic: string; prompt: string; explanation: string; notes?: string | null; repeatCount: number; correctAnswer: any; userAnswer: any };
export type Plan = { id: string; name: string; accessLevel?: number; priceMonthly?: number; priceMonthlyUsd?: number; priceMonthlyUzs?: number; trialDays?: number; description: string; features: string[]; paymentMethods?: string[] };
export type Subscription = { id: string; userId: string; planId: string; status: string; billingCycle: string; currentPeriodEnd: string | null; providerCustomerId?: string | null; providerSubscriptionId?: string | null; createdAt: string; updatedAt: string };
export type FeedbackItem = z.infer<typeof feedbackSchema> & { id: string; userId?: string | null; status: string; usefulnessScore?: number | null; difficulty?: string | null; willingnessToPay?: string | null; audienceRole?: string | null; goal?: string | null; contentType?: string | null; contentId?: string | null; confusionNote?: string | null; missingExplanation?: string | null; learnerGoal?: string | null; createdAt: string; updatedAt?: string };
export type BugReport = {
  id: string;
  page: string;
  happened: string;
  expected: string;
  deviceBrowser: string;
  screenshotNote?: string | null;
  contact?: string | null;
  severity: 'low' | 'medium' | 'high' | 'blocking' | string;
  status: 'new' | 'investigating' | 'fixed' | 'closed' | string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PilotLead = {
  id: string;
  contactName: string;
  email: string;
  phoneOrTelegram?: string | null;
  role: 'student' | 'parent' | 'teacher' | 'mentor' | 'school_leader' | 'learning_center_owner' | 'other' | string;
  organizationName: string;
  cityCountry: string;
  studentCount?: number | null;
  studentAgeRange?: string | null;
  currentCyberLevel: string;
  needsMost: string;
  interestLevel: 'curious' | 'interested' | 'ready_for_pilot' | string;
  wouldPay: 'yes' | 'no' | 'maybe' | string;
  message?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'pilot_started' | 'closed' | string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WaitlistSubmission = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string | null;
  countryCity?: string | null;
  studentCount?: number | null;
  interestLevel: string;
  message?: string | null;
  createdAt: string;
};

export type Capstone = {
  id: string;
  title: string;
  specialization: string;
  summary: string;
  deliverables: string[];
  difficulty: string;
};

export type GuidedProject = {
  id: string;
  slug: string;
  title: string;
  specialization: string;
  difficulty: string;
  summary: string;
  estimatedHours: number;
  checkpoints: string[];
  rubric: string[];
  starterLessonSlug?: string | null;
};

export type LearnerProject = {
  id: string;
  userId: string;
  guidedProjectId: string;
  status: 'not_started' | 'in_progress' | 'in_review' | 'done' | string;
  checkpointProgress: string[];
  reflection?: string | null;
  evidenceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  project: GuidedProject;
};

export type PortfolioArtifact = {
  id: string;
  userId?: string;
  title: string;
  artifactType: string;
  specialization: string;
  summary: string;
  deliverables: string[];
  status: 'draft' | 'in_review' | 'published' | 'approved' | string;
  evidenceUrl?: string | null;
  mentorFeedback?: string | null;
  scenario?: string;
  evidenceUsed?: string[];
  riskExplanation?: string;
  defensiveRecommendations?: string;
  reflection?: string;
  publicShareId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Certificate = {
  id: string;
  userId?: string;
  trackSlug: string;
  title: string;
  status?: string;
  issuedAt: string | null;
  criteria: { score: number; completionRate: number; quizAverage: number; portfolioCount?: number; labsPassed?: number; assessedSkills?: string[] };
};

export type Cohort = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cadence?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  mentorId?: string | null;
  memberCount?: number;
  members?: { id: string; name: string; email: string; membershipRole: string }[];
};

export type MentorAlert = {
  id: string;
  studentId: string;
  mentorId?: string | null;
  cohortId?: string | null;
  alertType?: string;
  category?: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  recommendation: string;
  status: 'open' | 'reviewing' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

export type MentorAssignment = {
  id: string;
  mentorId: string;
  studentId: string;
  lessonId?: string | null;
  trackSlug?: string | null;
  title: string;
  instructions: string;
  targetMastery?: number | null;
  dueAt?: string | null;
  status: 'open' | 'in_progress' | 'done' | string;
  rubric: string[];
  createdAt: string;
  updatedAt: string;
  student?: { name: string; email: string } | null;
};

export type ReviewItem = {
  id: string;
  userId: string;
  sourceType: string;
  sourceId?: string | null;
  topic: string;
  subtopic?: string | null;
  prompt: string;
  dueAt: string;
  lastReviewedAt?: string | null;
  intervalDays: number;
  easeFactor: number;
  successStreak: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PracticeHub = {
  streak: { days: number; nextMilestone: number; daysRemaining: number };
  continueLesson: { id: string; slug: string; title: string; phaseTitle: string; estimatedMinutes: number } | null;
  recoveryPlan?: { title: string; summary: string; actions: string[] } | null;
  dailyQuest: {
    title: string;
    rewardLabel: string;
    progress: number;
    total: number;
    steps: { id: string; label: string; href: string; done: boolean }[];
  };
  focusAreas: { id: string; title: string; description: string; badge: string; href: string; actionLabel: string }[];
  reviewQueue: { id: string; title: string; description: string; badge: string; href: string; actionLabel: string }[];
  assignments?: MentorAssignment[];
  activeProject?: LearnerProject | null;
  paths: { trackSlug: string; title: string; trackType: string; estimatedHours: number; hero: string; score: number; completionRate: number; quizAverage: number; band: string; reviewDueCount?: number }[];
};


export type DashboardResponse = {
  analytics: Analytics;
  roadmap: Roadmap | null;
  nextLessons: Lesson[];
  mentorFeedback: { id: string; message: string; createdAt: string }[];
  capstones: Capstone[];
  mastery: Mastery[];
  masterySummary?: MasterySummary;
  recommendations: Recommendation[];
  certificates: Certificate[];
  portfolio: PortfolioArtifact[];
  cohort: Cohort | null;
  assignments: MentorAssignment[];
  dueReviews: ReviewItem[];
  guidedProjects: GuidedProject[];
  learnerProjects: LearnerProject[];
  tracks: Track[];
  practiceHub: PracticeHub;
};

export type MasteryState = 'not_started' | 'introduced' | 'practiced' | 'proficient' | 'mastered' | 'needs_review';

export type SkillCategory = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type Skill = {
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

export type SkillMasteryRecord = {
  skillId: string;
  score: number;
  state: MasteryState;
  confidence: number;
  lessonCompletion: number;
  quizAccuracy: number;
  exercisePerformance: number;
  labScore: number;
  reviewSuccessStreak: number;
  portfolioQuality: number;
  lastPracticedAt?: string | null;
  nextReviewAt?: string | null;
  history: { at: string; score: number; state: MasteryState; reason: string }[];
};

export type SkillTreeNode = Skill & {
  mastery: SkillMasteryRecord;
  locked: boolean;
  lockedReason?: string | null;
  recommended: boolean;
  lessons: { id: string; slug: string; title: string; completed?: boolean }[];
  exercises: Exercise[];
  labs: { id: string; slug: string; title: string }[];
};

export type SkillTreeCategory = SkillCategory & { nodes: SkillTreeNode[] };

export type ExerciseType = 'multiple_choice' | 'multi_select' | 'true_false' | 'matching' | 'short_answer' | 'scenario_classification' | 'evidence_selection' | 'risk_ranking' | 'log_interpretation' | 'policy_review' | 'report_writing';
export type PracticeMode = 'learn' | 'practice' | 'review' | 'mastery_challenge' | 'lab_prep';

export type Exercise = {
  id: string;
  skillId: string;
  type: ExerciseType;
  difficulty: number;
  mode: PracticeMode;
  prompt: string;
  scenario: string;
  options?: any;
  correctAnswer?: any;
  rubric?: string[];
  explanation: string;
  hints: string[];
  commonWrongAnswerExplanation: string;
  relatedLessonSlug: string;
  relatedLabSlug?: string;
};

export type PracticeSession = {
  id: string;
  mode: PracticeMode;
  skillId: string;
  skillTitle: string;
  exercises: Exercise[];
  masteryBefore: SkillMasteryRecord;
};

export type PracticeFeedback = {
  isCorrect: boolean;
  scoreDelta: number;
  updatedMastery: SkillMasteryRecord;
  explanation: string;
  wrongAnswerReason?: string;
  missedConcept?: string;
  reviewRecommendation: string;
  retryExercise?: Exercise;
  relatedLessonSlug: string;
};

export type MasterySummary = {
  records: SkillMasteryRecord[];
  weakestSkills: SkillTreeNode[];
  strongestSkills: SkillTreeNode[];
  needsReview: SkillTreeNode[];
  recommendedNextSkill: SkillTreeNode | null;
  pathProgress: { trackSlug: string; completed: number; total: number; percent: number }[];
};

export type ContentStatus = 'draft' | 'reviewed' | 'published' | 'needs_update';

export type ContentQualityMetadata = {
  status: ContentStatus;
  reviewer?: string | null;
  lastReviewedAt?: string | null;
  qualityScore?: number | null;
  learnerUsefulnessScore?: number | null;
  confusionNotes?: string[];
  revisionHistory?: { version: number; changedAt: string; summary: string; reviewer?: string | null }[];
};

export type LabSubmission = {
  id: string;
  labId: string;
  labSlug?: string;
  userId: string;
  answers: Record<string, unknown>;
  score: number;
  rubricResult?: Record<string, unknown> | null;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MentorReport = {
  id: string;
  cohortId?: string | null;
  studentId?: string | null;
  generatedAt: string;
  masteryBySkill: SkillMasteryRecord[];
  lessonCompletion: number;
  exerciseAccuracy: number;
  labScores: { labId: string; title: string; score: number }[];
  artifactQuality: { artifactId: string; title: string; status: PortfolioArtifact['status'] }[];
  reviewDebt: ReviewItem[];
  recommendedNextAction: string;
  teacherNotes?: string | null;
};

export type Feedback = FeedbackItem;
export type MasteryRecord = SkillMasteryRecord;
export type SkillTree = { categories: SkillTreeCategory[]; recommendedNextSkill: SkillTreeNode | null };

export const portfolioSchema = z.object({
  title: z.string().min(3).max(120),
  artifactType: z.enum(['incident-report', 'phishing-triage-note', 'access-review-memo', 'password-policy-audit', 'secure-code-review-summary', 'cloud-iam-review', 'risk-register', 'executive-summary', 'capstone-plan', 'secure-code-review', 'iam-review']),
  specialization: z.string().min(2).max(80), summary: z.string().min(20).max(2000), deliverables: z.array(z.string().min(2)).min(1).max(10),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable(), scenario: z.string().max(2000).optional().default(''), evidenceUsed: z.array(z.string().min(1)).max(20).optional().default([]),
  riskExplanation: z.string().max(2000).optional().default(''), defensiveRecommendations: z.string().max(2000).optional().default(''), reflection: z.string().max(2000).optional().default(''), sourceLabSubmissionId: z.string().optional().nullable()
});
export const portfolioPatchSchema = portfolioSchema.partial().extend({ status: z.enum(['draft', 'in_review', 'published']).optional() });
export const reviewOutcomeSchema = z.object({ success: z.boolean() });
export const learnerProjectPatchSchema = z.object({ status: z.enum(['not_started', 'in_progress', 'in_review', 'done']).optional(), checkpointProgress: z.array(z.string().min(1)).optional(), reflection: z.string().max(2000).optional().nullable(), evidenceUrl: z.string().url().optional().or(z.literal('')).nullable() });
export const assignmentStudentPatchSchema = z.object({ status: z.enum(['open', 'in_progress', 'done']) });
export const practiceModeSchema = z.enum(['learn', 'practice', 'review', 'mastery_challenge', 'lab_prep']);
export const practiceSubmitSchema = z.object({ sessionId: z.string().optional(), exerciseId: z.string().min(2), answer: z.unknown(), mode: practiceModeSchema.optional() });
export const userRolePatchSchema = z.object({ role: roleSchema });

export const caseAnswerSchema = z.object({
  questionId: z.string().min(1).max(40),
  answer: z.string().trim().min(1).max(300)
});

export const socSubmitSchema = z.object({
  decisions: z.array(z.object({
    alertId: z.string().min(1).max(20),
    verdict: z.enum(['true_positive', 'false_positive']),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    note: z.string().trim().min(20, 'Write at least a short sentence for each case note.').max(2000)
  })).min(1).max(50),
  durationSeconds: z.number().int().min(0).max(24 * 3600).optional()
});

const reservedHandles = new Set(['admin', 'root', 'support', 'cyberpath', 'me', 'settings', 'api', 'login', 'staff', 'mentor', 'teacher']);
export const profileHandleSchema = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/, 'Use 3-30 lowercase letters, numbers or dashes, starting and ending with a letter or number.')
  .refine((handle) => !reservedHandles.has(handle), 'That handle is reserved.');
export const profilePatchSchema = z.object({
  handle: profileHandleSchema.optional(),
  isPublic: z.boolean().optional(),
  headline: z.string().trim().max(120).optional(),
  openToWork: z.boolean().optional()
});

const caseText = (max: number) => z.string().trim().min(1).max(max);
export const caseDraftSchema = z.object({
  title: caseText(80),
  summary: caseText(240),
  story: caseText(2000),
  category: z.enum(['Authentication', 'Phishing', 'Endpoint', 'Network', 'Cloud', 'Web']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedMinutes: z.number().int().min(5).max(120),
  skills: z.array(caseText(40)).min(1).max(6),
  evidence: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,30}$/),
    name: z.string().trim().regex(/^[\w.-]{1,60}$/, 'Evidence file names may use letters, numbers, dots, dashes and underscores.'),
    kind: z.enum(['log', 'email', 'json', 'csv', 'text']),
    description: caseText(200),
    content: z.string().min(1).max(50_000)
  })).min(1).max(5),
  questions: z.array(z.object({
    id: z.string().regex(/^q\d{1,2}$/),
    prompt: caseText(300),
    format: caseText(60),
    hint: caseText(300),
    options: z.array(caseText(200)).min(2).max(6).optional(),
    answers: z.array(caseText(200)).min(1).max(5),
    explanation: caseText(1000),
    points: z.number().int().min(5).max(20)
  })).min(3).max(10),
  debrief: caseText(3000)
}).superRefine((value, ctx) => {
  const ids = new Set<string>();
  value.questions.forEach((question, index) => {
    if (ids.has(question.id)) ctx.addIssue({ code: 'custom', path: ['questions', index, 'id'], message: `Question id ${question.id} is used twice.` });
    ids.add(question.id);
    if (question.options && !(question.answers.length === 1 && question.options.includes(question.answers[0]))) {
      ctx.addIssue({ code: 'custom', path: ['questions', index, 'answers'], message: `Question ${index + 1}: a multiple-choice question needs exactly one answer, copied from its options.` });
    }
  });
  if (new Set(value.evidence.map((item) => item.name)).size !== value.evidence.length) ctx.addIssue({ code: 'custom', path: ['evidence'], message: 'Evidence file names must be unique.' });
  if (new Set(value.evidence.map((item) => item.id)).size !== value.evidence.length) ctx.addIssue({ code: 'custom', path: ['evidence'], message: 'Evidence ids must be unique.' });
});
export const caseReviewSchema = z.object({
  decision: z.enum(['publish', 'changes_requested', 'rejected']),
  note: z.string().trim().max(2000).optional()
});
export type CaseDraft = z.infer<typeof caseDraftSchema>;

export const discussionPostSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('comment'), body: z.string().trim().min(2, 'Write at least 2 characters.').max(2000, 'Comments can be up to 2000 characters.') }),
  z.object({ kind: z.literal('writeup'), body: z.string().trim().min(80, 'A writeup needs at least 80 characters.').max(8000, 'Writeups can be up to 8000 characters.') })
]);
export const discussionReportSchema = z.object({ reason: z.string().trim().min(3).max(300) });
export const examSaveSchema = z.object({
  answers: z.record(z.string().max(80), z.string().max(500)).refine((value) => Object.keys(value).length <= 50, 'Too many answers.').optional(),
  report: z.string().max(12000, 'The report can be up to 12000 characters.').optional()
});
export const examGradeSchema = z.object({
  scores: z.record(z.string().max(40), z.number().int().min(0).max(100)),
  note: z.string().trim().min(10, 'Leave the candidate a short note (at least 10 characters).').max(3000)
});
export const teamCreateSchema = z.object({
  name: z.string().trim().min(3, 'Give the team a name of at least 3 characters.').max(80),
  description: z.string().trim().max(300).optional()
});
export const teamJoinSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/, 'Join codes are 8 letters and numbers.') });
export const jobKinds = ['full_time', 'part_time', 'internship', 'apprenticeship', 'volunteer'] as const;
export const jobPostSchema = z.object({
  title: z.string().trim().min(3).max(120),
  company: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  remote: z.boolean(),
  kind: z.enum(jobKinds),
  description: z.string().trim().min(30).max(4000),
  // Only links a learner can safely click: no javascript: or plain-http phishing pages.
  applyUrl: z.string().trim().max(500).refine((value) => /^https:\/\/[^\s/]+\.[^\s]+$/i.test(value) || /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value), 'Use an https:// link or a mailto: address.')
});
export const jobReviewSchema = z.object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(500).optional() });
export const discussionModerateSchema = z.object({ action: z.enum(['hide', 'restore']) });
