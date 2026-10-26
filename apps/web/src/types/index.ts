export type * from '@cyberpath/contracts';
export type { CaseCategory, CaseDifficulty, CaseEvidence, PublicInvestigationCase } from '@cyberpath/contracts/cases';

export type CaseProgress = { solvedQuestions: number; totalQuestions: number; pointsEarned: number; totalPoints: number; completed: boolean };
export type CaseListItem = Omit<import('@cyberpath/contracts/cases').PublicInvestigationCase, 'evidence' | 'questions' | 'story'> & { evidenceCount: number; questionCount: number; progress: CaseProgress };
export type CaseQuestionState = import('@cyberpath/contracts/cases').PublicCaseQuestion & { attempts: number; solved: boolean; pointsAwarded: number; explanation: string | null };
export type CaseDetail = Omit<import('@cyberpath/contracts/cases').PublicInvestigationCase, 'questions'> & { questions: CaseQuestionState[]; debrief: string | null };
export type CaseDetailResponse = { case: CaseDetail; progress: CaseProgress };
export type CaseAnswerResponse = CaseDetailResponse & { correct: boolean; alreadySolved: boolean; pointsAwarded: number };

export type { AlertSeverity, AlertVerdict, SocAlertResult, SocShiftResult } from '@cyberpath/contracts/soc';
export type SocPublicAlert = Omit<import('@cyberpath/contracts/soc').SocAlert, 'key'>;
export type SocShiftListItem = Omit<import('@cyberpath/contracts/soc').SocShift, 'alerts' | 'briefing'> & { alertCount: number; maxScore: number; attempts: number; bestScore: number | null };
export type SocShiftDetailResponse = { shift: Omit<import('@cyberpath/contracts/soc').SocShift, 'alerts'> & { alerts: SocPublicAlert[] }; attempts: number; bestScore: number | null; lastResult: import('@cyberpath/contracts/soc').SocShiftResult | null };
export type SocSubmitResponse = { result: import('@cyberpath/contracts/soc').SocShiftResult; personalBest: boolean; attempts: number; bestScore: number | null };
