export type * from '@cyberpath/contracts';
export type { CaseCategory, CaseDifficulty, CaseEvidence, PublicInvestigationCase } from '@cyberpath/contracts/cases';

export type CaseProgress = { solvedQuestions: number; totalQuestions: number; pointsEarned: number; totalPoints: number; completed: boolean };
export type CaseListItem = Omit<import('@cyberpath/contracts/cases').PublicInvestigationCase, 'evidence' | 'questions' | 'story'> & { evidenceCount: number; questionCount: number; progress: CaseProgress };
export type CaseQuestionState = import('@cyberpath/contracts/cases').PublicCaseQuestion & { attempts: number; solved: boolean; pointsAwarded: number; explanation: string | null };
export type CaseDetail = Omit<import('@cyberpath/contracts/cases').PublicInvestigationCase, 'questions'> & { questions: CaseQuestionState[]; debrief: string | null };
export type CaseDetailResponse = { case: CaseDetail; progress: CaseProgress };
export type CaseAnswerResponse = CaseDetailResponse & { correct: boolean; alreadySolved: boolean; pointsAwarded: number };
