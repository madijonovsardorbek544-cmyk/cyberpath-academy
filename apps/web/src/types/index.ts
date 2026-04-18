export type Role = 'student' | 'mentor' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  goal?: string | null;
  experienceLevel?: string | null;
  placementScore?: number | null;
  roadmapJson?: Roadmap | null;
  streakDays?: number;
};

export type Roadmap = {
  goal: string;
  experienceLevel: string;
  score: number;
  pace: string;
  modules: { week: number; title: string; focus: string; successMetric: string }[];
  advice: string[];
  specializationReady: boolean;
};

export type Track = {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string;
  frameworkRef: string;
  trackType?: 'career' | 'skill' | string;
  estimatedHours?: number;
  hero?: string;
  outcomes?: string[];
  targetRoles: string[];
  skills: string[];
  milestones: string[];
  entryPoints?: string[];
  prerequisites?: string[];
  recommendedFor?: string[];
  lessonCount?: number;
  competencies?: { lessonId: string; competency: string; weight: number }[];
  lessonLinks?: { lessonId: string; competency: string; weight: number }[];
};

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  phase: number;
  phaseTitle: string;
  level: string;
  orderIndex: number;
  specialization?: string | null;
  estimatedMinutes: number;
  learningObjectives: string[];
  content: string;
  glossary: { term: string; definition: string }[];
  examples: string[];
  knowledgeChecks: string[];
  commonMistakes: string;
  whyItMatters: string;
  icon?: string;
  version?: number;
  lastReviewedAt?: string | null;
  reviewDueAt?: string | null;
  reviewedBy?: string | null;
  revisionCount?: number;
  relatedTracks?: Track[];
  completed?: boolean;
  timeSpentMinutes?: number;
  quizQuestions?: QuizQuestion[];
};

export type QuizQuestion = {
  id: string;
  lessonId: string;
  prompt: string;
  type: 'multiple-choice' | 'multi-select' | 'true-false' | 'matching' | 'short-response' | 'scenario';
  difficulty: string;
  topic: string;
  subtopic: string;
  explanation: string;
  scenarioContext?: string | null;
  options: any;
  answer: any;
};

export type QuizResult = {
  score: number;
  correct: number;
  total: number;
  difficulty: string;
  topicScores: Record<string, number>;
  review: {
    id: string;
    prompt: string;
    type: string;
    explanation: string;
    yourAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
  }[];
};

export type Analytics = {
  totalCompleted: number;
  completionRate: number;
  totalQuizAccuracy: number;
  weakTopics: { topic: string; misses: number }[];
  topicAccuracy: { topic: string; accuracy: number }[];
  timeStudied: number;
  streakDays: number;
  milestones: { label: string; done: boolean }[];
  readiness: { specialization: number; capstone: number };
  skillRadar: { skill: string; value: number }[];
};

export type Mastery = {
  trackSlug: string;
  title: string;
  frameworkRef: string;
  trackType?: string;
  estimatedHours?: number;
  hero?: string;
  score: number;
  quizAverage: number;
  completionRate: number;
  status: 'Foundational' | 'Familiar' | 'Developing' | 'Ready' | string;
  band: 'attempted' | 'familiar' | 'proficient' | 'mastered' | string;
  evidence: string[];
  nextMilestone: string;
  milestones?: string[];
  skills?: string[];
  skillSignals?: { skill: string; score: number; state: string }[];
  reviewDueCount?: number;
  reviewHealth?: number;
  confidence?: number;
  evidenceCount?: number;
  lessonCount?: number;
  entryPoints?: string[];
  prerequisites?: string[];
  recommendedFor?: string[];
};

export type Recommendation = {
  id: string;
  title: string;
  reason: string;
  actionType: 'lesson' | 'lab' | 'quiz' | 'portfolio';
  actionTarget: string;
  priority: 'high' | 'medium' | 'low';
};

export type Lab = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  dataset: any;
  tasks: { id: string; prompt: string; expectedKeywords: string[] }[];
  safeGuardrails: string;
  solutionOutline: string;
};

export type Mistake = {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  explanation: string;
  notes?: string | null;
  repeatCount: number;
  correctAnswer: any;
  userAnswer: any;
};



export type Plan = {
  id: string;
  name: string;
  accessLevel?: number;
  priceMonthly?: number;
  priceMonthlyUsd?: number;
  priceMonthlyUzs?: number;
  trialDays?: number;
  description: string;
  features: string[];
  paymentMethods?: string[];
};

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: 'inactive' | 'active' | 'past_due' | 'canceled' | string;
  billingCycle: string;
  currentPeriodEnd: string | null;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackItem = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  category: 'bug' | 'content' | 'feature' | 'billing' | 'support' | string;
  message: string;
  status: 'new' | 'reviewed' | 'resolved' | string;
  createdAt: string;
  updatedAt?: string;
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
  title: string;
  artifactType: string;
  specialization: string;
  summary: string;
  deliverables: string[];
  status: 'draft' | 'in_review' | 'published' | 'approved' | string;
  evidenceUrl?: string | null;
  mentorFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Certificate = {
  id: string;
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
