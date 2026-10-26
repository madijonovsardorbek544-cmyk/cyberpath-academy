// Mock-demo handlers for the newer learner features. State lives in its own localStorage key so the
// older demo database format does not change.
import { caseAnswerSchema, caseDraftSchema, caseReviewSchema, discussionModerateSchema, discussionPostSchema, discussionReportSchema, examGradeSchema, examSaveSchema, profilePatchSchema, socSubmitSchema } from "@cyberpath/contracts";
import { LEAGUE_TIERS, XP_RULES, addDays, badgeCatalog, computeStreak, leaderboardName, levelForXp, weekStartOf, type XpEvent } from "@cyberpath/contracts/gamification";

export type MockFeatureContext = { userId: string | null; userName?: string; role?: string; students: Array<{ id: string; name: string; createdAt?: string; lessons: Array<{ id: string; title: string; at: string }> }> };

const FEATURE_KEY = "cyberpath-demo-features-v1";

type CaseRow = { attempts: number; pointsAwarded: number; solvedAt: string | null };
type SocAttempt = { score: number; result: unknown; createdAt: string };
type ProfileRow = { handle: string | null; isPublic: boolean; headline: string };
type CommunityRow = { id: string; slug: string; authorId: string; authorName: string; status: string; reviewNote: string | null; case: Record<string, unknown>; createdAt: string; updatedAt: string; publishedAt: string | null };
type DiscussionRow = { id: string; targetType: string; targetSlug: string; userId: string; authorName: string; authorRole: string; kind: "comment" | "writeup"; body: string; status: "visible" | "hidden"; reports: Array<{ userId: string; reason: string }>; createdAt: string; updatedAt: string };
type ExamRow = { id: string; userId: string; userName: string; status: "in_progress" | "submitted" | "passed" | "failed"; startedAt: string; deadlineAt: string; submittedAt: string | null; answers: Record<string, string>; report: string; sections: unknown[]; autoScore: number; reportLines: unknown[] | null; reportScore: number | null; note: string | null; reviewedAt: string | null; code: string | null };
type FeatureState = { cases: Record<string, Record<string, Record<string, CaseRow>>>; soc: Record<string, Record<string, SocAttempt[]>>; profiles: Record<string, ProfileRow>; community: CommunityRow[]; discussions: DiscussionRow[]; exams: ExamRow[] };

function readState(): FeatureState {
  try {
    const parsed = JSON.parse(localStorage.getItem(FEATURE_KEY) || "null") as FeatureState | null;
    if (parsed && typeof parsed.cases === "object") return { ...parsed, soc: parsed.soc ?? {}, profiles: parsed.profiles ?? {}, community: parsed.community ?? [], discussions: parsed.discussions ?? [], exams: parsed.exams ?? [] };
  } catch {
    // Corrupt demo state is replaced below.
  }
  return { cases: {}, soc: {}, profiles: {}, community: [], discussions: [], exams: [] };
}

function writeState(state: FeatureState) {
  localStorage.setItem(FEATURE_KEY, JSON.stringify(state));
}

// The answer bank is only bundled into the mock demo build; the literal env check lets Vite drop it from live builds.
function loadCaseBank() {
  return import.meta.env.VITE_API_MODE === "mock"
    ? import("@cyberpath/contracts/cases")
    : Promise.reject(new Error("Case content is served by the API outside the demo."));
}

function loadEventBank() {
  return import.meta.env.VITE_API_MODE === "mock"
    ? import("@cyberpath/contracts/event")
    : Promise.reject(new Error("Event content is served by the API outside the demo."));
}
// Set VITE_EVENT_START_DATE (YYYY-MM-DD) to rehearse the event in the demo before December.
const eventStartsOn = (fallback: string) => (import.meta.env.VITE_EVENT_START_DATE as string | undefined) || fallback;

type CaseBank = Awaited<ReturnType<typeof loadCaseBank>>;
type InvestigationCase = CaseBank["investigationCases"][number];

function caseView(bank: CaseBank, item: InvestigationCase, rows: Record<string, CaseRow>) {
  const solvedQuestions = item.questions.filter((question) => rows[question.id]?.solvedAt).length;
  const progress = {
    solvedQuestions,
    totalQuestions: item.questions.length,
    pointsEarned: Object.values(rows).reduce((sum, row) => sum + row.pointsAwarded, 0),
    totalPoints: bank.caseTotalPoints(item),
    completed: solvedQuestions === item.questions.length
  };
  const publicCase = bank.toPublicCase(item);
  return {
    progress,
    case: {
      ...publicCase,
      questions: publicCase.questions.map((question, index) => {
        const row = rows[question.id];
        return { ...question, attempts: row?.attempts ?? 0, solved: Boolean(row?.solvedAt), pointsAwarded: row?.pointsAwarded ?? 0, explanation: row?.solvedAt ? item.questions[index].explanation : null };
      }),
      debrief: progress.completed ? item.debrief : null
    }
  };
}

async function handleCases(method: string, path: string, body: unknown, userId: string) {
  const bank = await loadCaseBank();
  const state = readState();
  const mine = (state.cases[userId] ??= {});
  const community = state.community.filter((row) => row.status === "published").map((row) => ({ ...(row.case as unknown as InvestigationCase), slug: row.slug, source: "community", author: leaderboardName(row.authorName) }));
  const all = [...bank.investigationCases.map((item) => ({ ...item, source: "core", author: null })), ...community];

  if (method === "GET" && path === "/cases") {
    return {
      cases: all.map((item) => {
        const { evidence, questions, story: _story, ...meta } = bank.toPublicCase(item);
        return { ...meta, evidenceCount: evidence.length, questionCount: questions.length, progress: caseView(bank, item, mine[item.slug] ?? {}).progress };
      })
    };
  }

  const [, , slug, action] = path.split("/");
  const events = await loadEventBank();
  const eventDay = events.findUnlockedEventDay(events.annualEvent, eventStartsOn(events.annualEvent.startsOn), slug ?? "", new Date());
  const item = all.find((entry) => entry.slug === slug) ?? eventDay;
  if (!item) throw new Error("Case not found.");
  const rows = (mine[item.slug] ??= {});

  if (method === "GET" && !action) return caseView(bank, item, rows);

  if (method === "POST" && action === "answer") {
    const data = caseAnswerSchema.parse(body);
    const question = item.questions.find((entry) => entry.id === data.questionId);
    if (!question) throw new Error("Question not found in this case.");
    const existing = rows[question.id];
    if (existing?.solvedAt) return { correct: true, alreadySolved: true, pointsAwarded: existing.pointsAwarded, ...caseView(bank, item, rows) };
    const correct = bank.isCaseAnswerCorrect(question, data.answer);
    const attempts = (existing?.attempts ?? 0) + 1;
    const pointsAwarded = correct ? bank.casePointsFor(question, attempts) : 0;
    rows[question.id] = { attempts, pointsAwarded, solvedAt: correct ? new Date().toISOString() : null };
    writeState(state);
    return { correct, alreadySolved: false, pointsAwarded, ...caseView(bank, item, rows) };
  }

  throw new Error(`No mock handler for ${method} ${path}`);
}

async function handleEvent(ctx: MockFeatureContext & { userId: string }) {
  const [bank, events] = await Promise.all([loadCaseBank(), loadEventBank()]);
  const { annualEvent } = events;
  const schedule = events.eventSchedule(annualEvent, eventStartsOn(annualEvent.startsOn), new Date());
  const state = readState();
  const names = new Map(ctx.students.map((student) => [student.id, student.name]));
  const standings = Object.entries(state.cases).map(([userId, cases]) => {
    const rows = annualEvent.days.flatMap((day) => Object.values(cases[day.slug] ?? {})).filter((row) => row.solvedAt && row.solvedAt < schedule.closesAt);
    return { userId, points: rows.reduce((sum, row) => sum + row.pointsAwarded, 0), solved: rows.length, last: rows.map((row) => row.solvedAt!).sort().at(-1) ?? "" };
  }).filter((row) => row.solved > 0).sort((a, b) => b.points - a.points || a.last.localeCompare(b.last));
  const ranked = standings.map((row, index) => ({ rank: index + 1, userId: row.userId, name: leaderboardName(names.get(row.userId) ?? "Learner"), points: row.points, solved: row.solved }));
  const me = ranked.find((row) => row.userId === ctx.userId);
  const mine = state.cases[ctx.userId] ?? {};
  return {
    event: { slug: annualEvent.slug, title: annualEvent.title, summary: annualEvent.summary, startsAt: schedule.startsAt, closesAt: schedule.closesAt, status: schedule.status },
    days: schedule.days.map((day, index) => {
      const item = annualEvent.days[index];
      const progress = caseView(bank, item, mine[item.slug] ?? {}).progress;
      return { ...day, title: day.unlocked ? item.title : `Day ${day.day}`, summary: day.unlocked ? item.summary : null, category: day.unlocked ? item.category : null, totalPoints: progress.totalPoints, pointsEarned: progress.pointsEarned, completed: progress.completed };
    }),
    leaderboard: ranked.slice(0, 20).map(({ userId, ...row }) => ({ ...row, isMe: userId === ctx.userId })),
    me: me ? { rank: me.rank, points: me.points, solved: me.solved } : null
  };
}

const STAFF_ROLES = new Set(["mentor", "admin"]);

async function handleDiscussions(method: string, path: string, body: unknown, ctx: MockFeatureContext & { userId: string }) {
  const state = readState();
  const staff = STAFF_ROLES.has(ctx.role ?? "");
  const view = (row: DiscussionRow) => ({ id: row.id, kind: row.kind, body: row.body, status: row.status, author: leaderboardName(row.authorName), authorRole: STAFF_ROLES.has(row.authorRole) ? row.authorRole : null, isMine: row.userId === ctx.userId, createdAt: row.createdAt, updatedAt: row.updatedAt });
  const parts = path.split("/").filter(Boolean);

  if (method === "GET" && path === "/discussions/moderation") {
    if (!staff) throw new Error("You do not have access to this area.");
    return { posts: state.discussions.filter((row) => row.status === "hidden" || row.reports.length).map((row) => ({ ...view(row), targetType: row.targetType, targetSlug: row.targetSlug, reportCount: row.reports.length, reasons: row.reports.map((report) => report.reason) })) };
  }

  if (parts[1] === "posts") {
    const row = state.discussions.find((entry) => entry.id === parts[2]);
    if (!row) throw new Error("Post not found.");
    if (method === "DELETE") {
      if (row.userId !== ctx.userId && !staff) throw new Error("You can only delete your own posts.");
      state.discussions = state.discussions.filter((entry) => entry.id !== row.id);
    } else if (parts[3] === "report") {
      if (row.userId === ctx.userId) throw new Error("You cannot report your own post.");
      const data = discussionReportSchema.parse(body);
      if (!row.reports.some((report) => report.userId === ctx.userId)) row.reports.push({ userId: ctx.userId, reason: data.reason });
      if (row.reports.length >= 3) row.status = "hidden";
    } else if (parts[3] === "moderate") {
      if (!staff) throw new Error("You do not have access to this area.");
      const data = discussionModerateSchema.parse(body);
      row.status = data.action === "hide" ? "hidden" : "visible";
      if (data.action === "restore") row.reports = [];
    }
    writeState(state);
    return { ok: true, post: view(row) };
  }

  const [, targetType, targetSlug] = parts;
  if (targetType !== "lesson" && targetType !== "case") throw new Error("Nothing to discuss here.");
  let completed = false;
  if (targetType === "case") {
    const [bank, events] = await Promise.all([loadCaseBank(), loadEventBank()]);
    const community = state.community.find((row) => row.slug === targetSlug && row.status === "published")?.case as unknown as InvestigationCase | undefined;
    const item = bank.findInvestigationCase(targetSlug) ?? community ?? events.findUnlockedEventDay(events.annualEvent, eventStartsOn(events.annualEvent.startsOn), targetSlug, new Date());
    if (!item) throw new Error("Nothing to discuss here.");
    completed = item.questions.every((question) => state.cases[ctx.userId]?.[targetSlug]?.[question.id]?.solvedAt);
  }
  const writeupsAllowed = targetType === "case";
  const writeupsUnlocked = writeupsAllowed && (completed || staff);
  const here = (kind: string) => state.discussions.filter((row) => row.targetType === targetType && row.targetSlug === targetSlug && row.kind === kind && (row.status === "visible" || row.userId === ctx.userId || staff)).map(view);

  if (method === "GET") return { comments: here("comment"), writeups: writeupsUnlocked ? here("writeup") : [], writeupsAllowed, writeupsUnlocked, canWriteWriteup: writeupsAllowed && completed };

  if (method === "POST") {
    const data = discussionPostSchema.parse(body);
    if (data.kind === "writeup" && !(writeupsAllowed && completed)) throw new Error("Finish the case before writing a writeup.");
    const now = new Date().toISOString();
    const existing = data.kind === "writeup" ? state.discussions.find((row) => row.kind === "writeup" && row.targetType === targetType && row.targetSlug === targetSlug && row.userId === ctx.userId) : undefined;
    if (existing) Object.assign(existing, { body: data.body, updatedAt: now });
    else state.discussions.push({ id: crypto.randomUUID(), targetType, targetSlug, userId: ctx.userId, authorName: ctx.userName ?? "Learner", authorRole: ctx.role ?? "student", kind: data.kind, body: data.body, status: "visible", reports: [], createdAt: now, updatedAt: now });
    writeState(state);
    return { post: view(existing ?? state.discussions.at(-1)!) };
  }
  throw new Error(`No mock handler for ${method} ${path}`);
}

function loadExamBank() {
  return import.meta.env.VITE_API_MODE === "mock"
    ? import("@cyberpath/contracts/exam")
    : Promise.reject(new Error("Exam content is served by the API outside the demo."));
}

async function handleExams(method: string, path: string, body: unknown, ctx: MockFeatureContext) {
  const { analystExam: exam, ...bank } = await loadExamBank();
  const state = readState();
  const DAY = 24 * 60 * 60 * 1000;
  const parts = path.split("/").filter(Boolean);
  const submit = (row: ExamRow, at = new Date().toISOString()) => {
    const graded = bank.gradeExamAnswers(exam, row.answers);
    Object.assign(row, { status: "submitted", submittedAt: at, sections: graded.sections, autoScore: graded.total });
  };
  for (const row of state.exams) if (row.status === "in_progress" && Date.now() > Date.parse(row.deadlineAt) + 2 * 60 * 1000) submit(row, row.deadlineAt);
  const summary = (row: ExamRow) => ({ id: row.id, status: row.status, startedAt: row.startedAt, deadlineAt: row.deadlineAt, submittedAt: row.submittedAt, totalScore: row.reportScore === null ? null : row.autoScore + row.reportScore, certificateCode: row.code });
  const detail = (row: ExamRow) => ({
    ...summary(row), answers: row.answers, report: row.report, exam: bank.toPublicExam(exam),
    result: row.status === "in_progress" ? null : { sections: row.sections, autoScore: row.autoScore, autoMax: bank.examQuestionPoints(exam), report: row.reportLines, reportScore: row.reportScore, reportMax: bank.examReportPoints(exam), reviewerNote: row.note, passed: row.status === "passed" }
  });
  const done = <T,>(value: T) => { writeState(state); return value; };

  if (parts[1] === "verify") {
    const row = state.exams.find((entry) => entry.code === decodeURIComponent(parts[2] ?? "").trim().toUpperCase() && entry.status === "passed");
    if (!row) throw new Error("No passed exam matches this code.");
    return { certificate: { code: row.code, name: row.userName, exam: exam.title, passedAt: row.reviewedAt, score: row.autoScore + (row.reportScore ?? 0) } };
  }
  const userId = ctx.userId;
  if (!userId) throw new Error("Authentication required.");
  const staff = ctx.role === "mentor" || ctx.role === "admin";
  const mine = state.exams.filter((row) => row.userId === userId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const active = mine.find((row) => row.status === "in_progress");
  const lastFail = mine.find((row) => row.status === "failed");
  const cooldownUntil = lastFail?.reviewedAt ? new Date(Date.parse(lastFail.reviewedAt) + exam.retakeCooldownDays * DAY).toISOString() : null;
  const blockedReason = active ? null : mine.some((row) => row.status === "passed") ? "You have already passed this exam." : mine.some((row) => row.status === "submitted") ? "Your last attempt is waiting for a mentor to grade the report." : cooldownUntil && cooldownUntil > new Date().toISOString() ? `You can retake the exam after ${cooldownUntil.slice(0, 10)}.` : null;

  if (method === "GET" && parts.length === 1) {
    return done({
      exam: { slug: exam.slug, title: exam.title, summary: exam.summary, scenario: exam.scenario, durationMinutes: exam.durationMinutes, passMark: exam.passMark, reportPassMark: exam.reportPassMark, retakeCooldownDays: exam.retakeCooldownDays, sections: exam.sections.map((section) => ({ id: section.id, title: section.title, questionCount: section.questions.length })), questionPoints: bank.examQuestionPoints(exam), reportPoints: bank.examReportPoints(exam), rubric: exam.report.rubric },
      attempts: mine.map(summary), activeAttemptId: active?.id ?? null, canStart: !active && !blockedReason, blockedReason
    });
  }
  if (method === "POST" && parts[2] === "start") {
    if (active) return done({ attempt: detail(active) });
    if (blockedReason) throw new Error(blockedReason);
    const started = new Date();
    const row: ExamRow = { id: crypto.randomUUID(), userId, userName: ctx.userName ?? "Learner", status: "in_progress", startedAt: started.toISOString(), deadlineAt: new Date(started.getTime() + exam.durationMinutes * 60 * 1000).toISOString(), submittedAt: null, answers: {}, report: "", sections: [], autoScore: 0, reportLines: null, reportScore: null, note: null, reviewedAt: null, code: null };
    state.exams.push(row);
    return done({ attempt: detail(row) });
  }
  if (method === "GET" && parts[1] === "review") {
    if (!staff) throw new Error("You do not have access to this area.");
    return done({ rubric: exam.report.rubric, reportPrompt: exam.report.prompt, attempts: state.exams.filter((row) => row.status === "submitted").map((row) => ({ ...summary(row), candidate: row.userName, report: row.report, autoScore: row.autoScore, autoMax: bank.examQuestionPoints(exam), sections: row.sections })) });
  }

  const row = state.exams.find((entry) => entry.id === parts[2]);
  if (parts[1] !== "attempts" || !row) throw new Error("Attempt not found.");
  if (parts[3] === "grade") {
    if (!staff) throw new Error("You do not have access to this area.");
    if (row.userId === userId) throw new Error("You cannot grade your own exam.");
    if (row.status !== "submitted") throw new Error("Only submitted attempts can be graded.");
    const data = examGradeSchema.parse(body);
    const report = bank.scoreReport(exam, data.scores);
    const passed = bank.examPassed(exam, row.autoScore, report.total);
    const hex = Array.from(crypto.getRandomValues(new Uint8Array(5)), (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    Object.assign(row, { status: passed ? "passed" : "failed", reportLines: report.criteria, reportScore: report.total, note: data.note, reviewedAt: new Date().toISOString(), code: passed ? `CPA1-${hex.slice(0, 5)}-${hex.slice(5)}` : null });
    return done({ attempt: detail(row) });
  }
  if (row.userId !== userId) throw new Error("Attempt not found.");
  if (method === "GET") return done({ attempt: detail(row) });
  if (method === "PATCH") {
    if (row.status !== "in_progress") throw new Error("Time is up. This attempt has been submitted.");
    const data = examSaveSchema.parse(body);
    const valid = new Set(exam.sections.flatMap((section) => section.questions.map((question) => `${section.id}.${question.id}`)));
    for (const [key, value] of Object.entries(data.answers ?? {})) if (valid.has(key)) row.answers[key] = value;
    if (data.report !== undefined) row.report = data.report;
    return done({ attempt: detail(row) });
  }
  if (method === "POST" && parts[3] === "submit") {
    if (row.status === "in_progress") {
      if (Date.now() < Date.parse(row.deadlineAt) && row.report.trim().length < exam.report.minLength) throw new Error(`Write at least ${exam.report.minLength} characters in the incident report before submitting.`);
      submit(row);
    }
    return done({ attempt: detail(row) });
  }
  throw new Error(`No mock handler for ${method} ${path}`);
}

function loadSocBank() {
  return import.meta.env.VITE_API_MODE === "mock"
    ? import("@cyberpath/contracts/soc")
    : Promise.reject(new Error("Shift content is served by the API outside the demo."));
}

async function handleSoc(method: string, path: string, body: unknown, userId: string) {
  const bank = await loadSocBank();
  const state = readState();
  const mine = (state.soc[userId] ??= {});
  const stats = (slug: string) => {
    const attempts = mine[slug] ?? [];
    return { attempts: attempts.length, bestScore: attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : null };
  };

  if (method === "GET" && path === "/soc/shifts") {
    return {
      shifts: bank.socShifts.map((shift) => {
        const { alerts, briefing: _briefing, ...meta } = shift;
        return { ...meta, alertCount: alerts.length, maxScore: bank.gradeSocShift(shift, []).maxScore, ...stats(shift.slug) };
      })
    };
  }

  const [, , , slug, action] = path.split("/");
  const shift = bank.findSocShift(slug ?? "");
  if (!shift) throw new Error("Shift not found.");

  if (method === "GET" && !action) {
    const attempts = mine[shift.slug] ?? [];
    return { shift: bank.toPublicShift(shift), ...stats(shift.slug), lastResult: attempts.at(-1)?.result ?? null };
  }

  if (method === "POST" && action === "submit") {
    const data = socSubmitSchema.parse(body);
    const ids = new Set(data.decisions.map((decision) => decision.alertId));
    if (ids.size !== shift.alerts.length || shift.alerts.some((alert) => !ids.has(alert.id))) throw new Error("Decide every alert in the queue exactly once before ending the shift.");
    if (data.decisions.some((decision) => decision.verdict === "true_positive" && !decision.severity)) throw new Error("Set a severity for every alert you mark as a true positive.");
    const result = bank.gradeSocShift(shift, data.decisions);
    const previousBest = stats(shift.slug).bestScore;
    (mine[shift.slug] ??= []).push({ score: result.score, result, createdAt: new Date().toISOString() });
    writeState(state);
    return { result, personalBest: previousBest === null || result.score > previousBest, ...stats(shift.slug) };
  }

  throw new Error(`No mock handler for ${method} ${path}`);
}

async function xpEventsFor(student: MockFeatureContext["students"][number], state: FeatureState): Promise<XpEvent[]> {
  const events: XpEvent[] = student.lessons.map((lesson) => ({ key: `lesson:${lesson.id}`, label: `Completed lesson: ${lesson.title}`, xp: XP_RULES.lessonComplete, at: lesson.at }));
  const caseRows = state.cases[student.id] ?? {};
  if (Object.keys(caseRows).length) {
    const [bank, eventBank] = await Promise.all([loadCaseBank(), loadEventBank()]);
    for (const [slug, rows] of Object.entries(caseRows)) {
      const item = bank.findInvestigationCase(slug) ?? eventBank.annualEvent.days.find((day) => day.slug === slug);
      if (!item) continue;
      const solved = Object.entries(rows).filter(([, row]) => row.solvedAt);
      for (const [questionId, row] of solved) events.push({ key: `case:${slug}:${questionId}`, label: `Solved a question in "${item.title}"`, xp: row.pointsAwarded, at: row.solvedAt! });
      if (solved.length === item.questions.length) events.push({ key: `case-complete:${slug}`, label: `Closed case "${item.title}"`, xp: XP_RULES.caseComplete, at: solved.map(([, row]) => row.solvedAt!).sort().at(-1)! });
    }
  }
  for (const [slug, attempts] of Object.entries(state.soc[student.id] ?? {})) {
    let best = 0;
    attempts.forEach((attempt, index) => {
      if (attempt.score > best) {
        events.push({ key: `soc:${slug}:${index}`, label: "New best on a SOC shift", xp: attempt.score - best, at: attempt.createdAt });
        best = attempt.score;
      }
    });
  }
  return events;
}

async function handleProgress(ctx: MockFeatureContext & { userId: string }) {
  const state = readState();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = weekStartOf(now);
  const inWeek = (event: XpEvent) => event.at >= weekStart && event.at < addDays(weekStart, 7);
  const standings = await Promise.all(ctx.students.map(async (student) => ({ student, events: await xpEventsFor(student, state) })));
  const mine = standings.find((entry) => entry.student.id === ctx.userId);
  const events = mine?.events ?? [];
  const totalXp = events.reduce((sum, event) => sum + event.xp, 0);
  const streak = computeStreak(events.map((event) => event.at.slice(0, 10)), today);
  const socAttempts = Object.values(state.soc[ctx.userId] ?? {}).flat();
  const caseBank = Object.keys(state.cases[ctx.userId] ?? {}).length ? await loadCaseBank() : null;
  const casesCompleted = caseBank ? caseBank.investigationCases.filter((item) => item.questions.every((question) => state.cases[ctx.userId]?.[item.slug]?.[question.id]?.solvedAt)).length : 0;
  const stats = {
    totalXp,
    lessonsCompleted: mine?.student.lessons.length ?? 0,
    casesCompleted,
    totalCases: caseBank?.investigationCases.length ?? 6,
    socShiftsWorked: socAttempts.length,
    perfectSocShift: socAttempts.some((attempt) => {
      const result = attempt.result as { correctVerdicts: number; totalAlerts: number };
      return result.correctVerdicts === result.totalAlerts;
    }),
    streak: streak.current
  };
  const members = standings
    .map((entry) => ({ name: leaderboardName(entry.student.name), xp: entry.events.filter(inWeek).reduce((sum, event) => sum + event.xp, 0), isMe: entry.student.id === ctx.userId }))
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  return {
    xp: { total: totalXp, thisWeek: events.filter(inWeek).reduce((sum, event) => sum + event.xp, 0), ...levelForXp(totalXp) },
    streak,
    league: mine ? { tier: 0, tierName: LEAGUE_TIERS[0], weekStart, weekEnds: addDays(weekStart, 7), rank: members.find((entry) => entry.isMe)!.rank, promoteCount: 5, demoteCount: 0, members } : null,
    badges: badgeCatalog.map(({ earned, ...badge }) => ({ ...badge, earnedAt: earned(stats) ? today : null })),
    recent: [...events].filter((event) => event.xp > 0).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10).map(({ label, xp, at }) => ({ label, xp, at }))
  };
}

async function handleProfile(method: string, path: string, body: unknown, ctx: MockFeatureContext) {
  const state = readState();
  const blank: ProfileRow = { handle: null, isPublic: false, headline: "" };

  if (method === "GET" && path.startsWith("/profile/public/")) {
    const handle = decodeURIComponent(path.split("/")[3] ?? "").toLowerCase();
    const ownerId = Object.keys(state.profiles).find((id) => state.profiles[id].isPublic && state.profiles[id].handle === handle);
    const owner = ctx.students.find((student) => student.id === ownerId);
    if (!ownerId || !owner) throw new Error("This profile does not exist or is private.");
    const progress = await handleProgress({ ...ctx, userId: ownerId });
    const caseBank = state.cases[ownerId] ? await loadCaseBank() : null;
    const socBank = state.soc[ownerId] ? await loadSocBank() : null;
    const { isPublic: _isPublic, ...settings } = state.profiles[ownerId];
    return {
      profile: {
        ...settings,
        name: owner.name,
        memberSince: owner.createdAt ?? new Date().toISOString(),
        level: progress.xp.level,
        totalXp: progress.xp.total,
        streak: progress.streak.current,
        badges: progress.badges.filter((badge) => badge.earnedAt),
        cases: caseBank ? caseBank.investigationCases.filter((item) => item.questions.every((question) => state.cases[ownerId]?.[item.slug]?.[question.id]?.solvedAt)).map((item) => ({ slug: item.slug, title: item.title, category: item.category, difficulty: item.difficulty, closedAt: new Date().toISOString() })) : [],
        soc: socBank ? socBank.socShifts.filter((shift) => state.soc[ownerId]?.[shift.slug]?.length).map((shift) => ({ slug: shift.slug, title: shift.title, bestScore: Math.max(...state.soc[ownerId][shift.slug].map((attempt) => attempt.score)), maxScore: socBank.gradeSocShift(shift, []).maxScore })) : [],
        artifacts: [],
        certificates: state.exams.filter((row) => row.userId === ownerId && row.status === "passed").map((row) => ({ title: "CyberPath Practical Analyst (CPA-1)", issuedAt: row.reviewedAt!, verifyCode: row.code }))
      }
    };
  }

  if (!ctx.userId) throw new Error("Authentication required.");
  const mine = state.profiles[ctx.userId] ?? blank;
  if (method === "GET" && path === "/profile/me") return { settings: mine };
  if (method === "PATCH" && path === "/profile/me") {
    const data = profilePatchSchema.parse(body);
    const next = { ...mine, ...data };
    if (next.isPublic && !next.handle) throw new Error("Choose a handle before making your profile public.");
    if (data.handle && Object.entries(state.profiles).some(([id, row]) => id !== ctx.userId && row.handle === data.handle)) throw new Error("That handle is already taken.");
    state.profiles[ctx.userId] = next;
    writeState(state);
    return { settings: next };
  }
  throw new Error(`No mock handler for ${method} ${path}`);
}

async function handleCommunity(method: string, path: string, body: unknown, ctx: MockFeatureContext & { userId: string }, role: string) {
  const state = readState();
  const [, , id, action] = path.split("/");
  const validate = async () => {
    const data = caseDraftSchema.parse((body as { case?: unknown })?.case);
    const indicators = (await loadCaseBank()).findRealWorldIndicators(data);
    if (indicators.length) throw new Error(`Use only documentation addresses and reserved domains. Found: ${indicators.slice(0, 5).join(", ")}`);
    return data;
  };
  const save = () => writeState(state);
  const submit = Boolean((body as { submit?: boolean })?.submit);

  if (method === "GET" && id === "mine") return { submissions: state.community.filter((row) => row.authorId === ctx.userId) };
  if (method === "GET" && id === "review") {
    if (role === "student") throw new Error("You do not have access to this resource.");
    return { submissions: state.community.filter((row) => row.status === "submitted") };
  }
  if (method === "POST" && !id) {
    const data = await validate();
    const now = new Date().toISOString();
    const row: CommunityRow = { id: crypto.randomUUID(), slug: `c-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${Math.random().toString(16).slice(2, 8)}`, authorId: ctx.userId, authorName: ctx.students.find((student) => student.id === ctx.userId)?.name ?? "Learner", status: submit ? "submitted" : "draft", reviewNote: null, case: data, createdAt: now, updatedAt: now, publishedAt: null };
    state.community.push(row);
    save();
    return { submission: row };
  }
  const row = state.community.find((entry) => entry.id === id);
  if (!row) throw new Error("Submission not found.");
  if (method === "PATCH" && !action) {
    if (row.authorId !== ctx.userId) throw new Error("Submission not found.");
    if (!["draft", "changes_requested"].includes(row.status)) throw new Error("Only drafts and cases with requested changes can be edited.");
    Object.assign(row, { case: await validate(), status: submit ? "submitted" : row.status, updatedAt: new Date().toISOString() });
    save();
    return { submission: row };
  }
  if (method === "DELETE" && !action) {
    if (row.authorId !== ctx.userId) throw new Error("Submission not found.");
    if (row.status === "published") throw new Error("Published cases cannot be deleted by their author. Ask a mentor.");
    state.community = state.community.filter((entry) => entry.id !== id);
    save();
    return { ok: true };
  }
  if (method === "POST" && action === "review") {
    if (role === "student") throw new Error("You do not have access to this resource.");
    if (row.authorId === ctx.userId) throw new Error("Another reviewer has to review your own case.");
    const data = caseReviewSchema.parse(body);
    if (data.decision !== "publish" && !data.note) throw new Error("Tell the author what to change.");
    const now = new Date().toISOString();
    Object.assign(row, { status: data.decision === "publish" ? "published" : data.decision, reviewNote: data.note ?? null, updatedAt: now, publishedAt: data.decision === "publish" ? now : null });
    save();
    return { submission: row };
  }
  throw new Error(`No mock handler for ${method} ${path}`);
}

/** Returns a response for feature routes, or null so the main mock handles the path. */
export function handleFeatureRequest(method: string, path: string, body: unknown, getContext: () => MockFeatureContext): Promise<unknown> | null {
  const isFeature = path === "/cases" || path.startsWith("/cases/") || path.startsWith("/soc/") || path === "/progress/me" || path.startsWith("/profile/") || path === "/community-cases" || path.startsWith("/community-cases/") || path === "/event" || path.startsWith("/discussions/") || path === "/exams" || path.startsWith("/exams/");
  if (!isFeature) return null;
  const route = (): Promise<unknown> | unknown => {
    const ctx = getContext();
    if (path.startsWith("/profile/")) return handleProfile(method, path, body, ctx);
    if (path === "/exams" || path.startsWith("/exams/")) return handleExams(method, path, body, ctx);
    const userId = ctx.userId;
    if (!userId) throw new Error("Authentication required.");
    if (path === "/progress/me" && method === "GET") return handleProgress({ ...ctx, userId });
    if (path === "/event" && method === "GET") return handleEvent({ ...ctx, userId });
    if (path.startsWith("/discussions/")) return handleDiscussions(method, path, body, { ...ctx, userId });
    if (path.startsWith("/community-cases")) return handleCommunity(method, path, body, { ...ctx, userId }, ctx.role ?? "student");
    if (path.startsWith("/soc/")) return handleSoc(method, path, body, userId);
    return handleCases(method, path, body, userId);
  };
  // Match the API's 400 message ("path: message") instead of surfacing the raw zod issue list.
  return Promise.resolve().then(route).catch((error: unknown) => {
    const issues = (error as { issues?: Array<{ path: PropertyKey[]; message: string }> }).issues;
    if (!Array.isArray(issues)) throw error;
    const issue = issues[0];
    throw new Error(`${issue?.path.join(".") || "request"}: ${issue?.message ?? "invalid"}`);
  });
}
