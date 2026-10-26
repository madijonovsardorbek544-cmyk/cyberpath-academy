// Mock-demo handlers for the newer learner features. State lives in its own localStorage key so the
// older demo database format does not change.
import { caseAnswerSchema, caseDraftSchema, caseReviewSchema, profilePatchSchema, socSubmitSchema } from "@cyberpath/contracts";
import { LEAGUE_TIERS, XP_RULES, addDays, badgeCatalog, computeStreak, leaderboardName, levelForXp, weekStartOf, type XpEvent } from "@cyberpath/contracts/gamification";

export type MockFeatureContext = { userId: string | null; role?: string; students: Array<{ id: string; name: string; createdAt?: string; lessons: Array<{ id: string; title: string; at: string }> }> };

const FEATURE_KEY = "cyberpath-demo-features-v1";

type CaseRow = { attempts: number; pointsAwarded: number; solvedAt: string | null };
type SocAttempt = { score: number; result: unknown; createdAt: string };
type ProfileRow = { handle: string | null; isPublic: boolean; headline: string };
type CommunityRow = { id: string; slug: string; authorId: string; authorName: string; status: string; reviewNote: string | null; case: Record<string, unknown>; createdAt: string; updatedAt: string; publishedAt: string | null };
type FeatureState = { cases: Record<string, Record<string, Record<string, CaseRow>>>; soc: Record<string, Record<string, SocAttempt[]>>; profiles: Record<string, ProfileRow>; community: CommunityRow[] };

function readState(): FeatureState {
  try {
    const parsed = JSON.parse(localStorage.getItem(FEATURE_KEY) || "null") as FeatureState | null;
    if (parsed && typeof parsed.cases === "object") return { ...parsed, soc: parsed.soc ?? {}, profiles: parsed.profiles ?? {}, community: parsed.community ?? [] };
  } catch {
    // Corrupt demo state is replaced below.
  }
  return { cases: {}, soc: {}, profiles: {}, community: [] };
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
  const item = all.find((entry) => entry.slug === slug);
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
    const bank = await loadCaseBank();
    for (const [slug, rows] of Object.entries(caseRows)) {
      const item = bank.findInvestigationCase(slug);
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
        certificates: []
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
  const isFeature = path === "/cases" || path.startsWith("/cases/") || path.startsWith("/soc/") || path === "/progress/me" || path.startsWith("/profile/") || path === "/community-cases" || path.startsWith("/community-cases/");
  if (!isFeature) return null;
  const route = (): Promise<unknown> | unknown => {
    const ctx = getContext();
    if (path.startsWith("/profile/")) return handleProfile(method, path, body, ctx);
    const userId = ctx.userId;
    if (!userId) throw new Error("Authentication required.");
    if (path === "/progress/me" && method === "GET") return handleProgress({ ...ctx, userId });
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
