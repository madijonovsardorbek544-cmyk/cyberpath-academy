export type * from '@cyberpath/contracts';
export type { CaseCategory, CaseDifficulty, CaseEvidence, PublicInvestigationCase } from '@cyberpath/contracts/cases';

export type CaseProgress = { solvedQuestions: number; totalQuestions: number; pointsEarned: number; totalPoints: number; completed: boolean };
export type CaseListItem = Omit<import('@cyberpath/contracts/cases').PublicInvestigationCase, 'evidence' | 'questions' | 'story'> & { evidenceCount: number; questionCount: number; progress: CaseProgress; source: 'core' | 'community'; author: string | null };
export type CaseQuestionState = import('@cyberpath/contracts/cases').PublicCaseQuestion & { attempts: number; solved: boolean; pointsAwarded: number; explanation: string | null };
export type CaseDetail = Omit<import('@cyberpath/contracts/cases').PublicInvestigationCase, 'questions'> & { questions: CaseQuestionState[]; debrief: string | null };
export type CaseDetailResponse = { case: CaseDetail; progress: CaseProgress };
export type CaseAnswerResponse = CaseDetailResponse & { correct: boolean; alreadySolved: boolean; pointsAwarded: number };

export type { AlertSeverity, AlertVerdict, SocAlertResult, SocShiftResult } from '@cyberpath/contracts/soc';
export type SocPublicAlert = Omit<import('@cyberpath/contracts/soc').SocAlert, 'key'>;
export type SocShiftListItem = Omit<import('@cyberpath/contracts/soc').SocShift, 'alerts' | 'briefing'> & { alertCount: number; maxScore: number; attempts: number; bestScore: number | null };
export type SocShiftDetailResponse = { shift: Omit<import('@cyberpath/contracts/soc').SocShift, 'alerts'> & { alerts: SocPublicAlert[] }; attempts: number; bestScore: number | null; lastResult: import('@cyberpath/contracts/soc').SocShiftResult | null };
export type SocSubmitResponse = { result: import('@cyberpath/contracts/soc').SocShiftResult; personalBest: boolean; attempts: number; bestScore: number | null };

export type LeagueMember = { name: string; xp: number; rank: number; isMe: boolean };
export type LearnerProgress = {
  xp: { total: number; thisWeek: number; level: number; currentLevelXp: number; nextLevelXp: number };
  streak: { current: number; activeToday: boolean; freezesUsed: string[]; freezeAvailableThisWeek: boolean };
  league: { tier: number; tierName: string; weekStart: string; weekEnds: string; rank: number; promoteCount: number; demoteCount: number; members: LeagueMember[] } | null;
  badges: Array<{ id: string; name: string; description: string; earnedAt: string | null }>;
  recent: Array<{ label: string; xp: number; at: string }>;
};

export type ProfileSettings = { handle: string | null; isPublic: boolean; headline: string };
export type PublicProfile = Omit<ProfileSettings, 'isPublic'> & {
  name: string;
  memberSince: string;
  level: number;
  totalXp: number;
  streak: number;
  badges: Array<{ id: string; name: string; description: string; earnedAt: string | null }>;
  cases: Array<{ slug: string; title: string; category: string; difficulty: string; closedAt: string }>;
  soc: Array<{ slug: string; title: string; bestScore: number; maxScore: number }>;
  artifacts: Array<{ title: string; type: string; shareId: string }>;
  certificates: Array<{ title: string; issuedAt: string; verifyCode?: string | null }>;
};

export type CommunitySubmission = { id: string; slug: string; status: 'draft' | 'submitted' | 'changes_requested' | 'published' | 'rejected'; reviewNote: string | null; authorName?: string; createdAt: string; updatedAt: string; publishedAt: string | null; case: import('@cyberpath/contracts').CaseDraft };

export type EventDay = { day: number; slug: string; unlocksAt: string; unlocked: boolean; title: string; summary: string | null; category: string | null; totalPoints: number; pointsEarned: number; completed: boolean };
export type EventResponse = {
  event: { slug: string; title: string; summary: string; startsAt: string; closesAt: string; status: 'upcoming' | 'live' | 'closed' };
  days: EventDay[];
  leaderboard: Array<{ rank: number; name: string; points: number; solved: number; isMe: boolean }>;
  me: { rank: number; points: number; solved: number } | null;
};

export type DiscussionPost = { id: string; kind: 'comment' | 'writeup'; body: string; status: 'visible' | 'hidden'; author: string; authorRole: string | null; isMine: boolean; createdAt: string; updatedAt: string };
export type DiscussionThread = { comments: DiscussionPost[]; writeups: DiscussionPost[]; writeupsAllowed: boolean; writeupsUnlocked: boolean; canWriteWriteup: boolean };
export type ModerationPost = DiscussionPost & { targetType: 'lesson' | 'case'; targetSlug: string; reportCount: number; reasons: string[] };

export type ExamRubricCriterion = { id: string; label: string; description: string; points: number };
export type ExamAttemptSummary = { id: string; status: 'in_progress' | 'submitted' | 'passed' | 'failed'; startedAt: string; deadlineAt: string; submittedAt: string | null; totalScore: number | null; certificateCode: string | null };
export type ExamOverview = {
  exam: { slug: string; title: string; summary: string; scenario: string; durationMinutes: number; passMark: number; reportPassMark: number; retakeCooldownDays: number; sections: Array<{ id: string; title: string; questionCount: number }>; questionPoints: number; reportPoints: number; rubric: ExamRubricCriterion[] };
  attempts: ExamAttemptSummary[];
  activeAttemptId: string | null;
  canStart: boolean;
  blockedReason: string | null;
};
export type ExamQuestion = { id: string; prompt: string; format: string; options?: string[]; points: number };
export type ExamSection = { id: string; title: string; brief: string; evidence: import('@cyberpath/contracts/cases').CaseEvidence[]; questions: ExamQuestion[] };
export type ExamScoreLine = { id: string; title?: string; label?: string; earned: number; max: number };
export type ExamAttempt = ExamAttemptSummary & {
  answers: Record<string, string>;
  report: string;
  exam: { slug: string; title: string; scenario: string; durationMinutes: number; sections: ExamSection[]; report: { prompt: string; minLength: number; maxLength: number; rubric: ExamRubricCriterion[] } };
  result: null | { sections: ExamScoreLine[]; autoScore: number; autoMax: number; report: ExamScoreLine[] | null; reportScore: number | null; reportMax: number; reviewerNote: string | null; passed: boolean };
};
export type ExamReviewItem = ExamAttemptSummary & { candidate: string; report: string; autoScore: number; autoMax: number; sections: ExamScoreLine[] };
export type ExamCertificate = { code: string; name: string; exam: string; passedAt: string; score: number };

export type TeamSummary = { id: string; name: string; description: string; leader: string; isLeader: boolean; joinCode: string | null; memberCount: number; createdAt: string };
export type TeamMember = { id: string; name: string; email: string; joinedAt: string; lessonsCompleted: number; casesClosed: number; xp: number; examStatus: string | null; lastActiveAt: string | null };
