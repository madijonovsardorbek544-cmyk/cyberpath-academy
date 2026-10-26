// Mock-demo handlers for the newer learner features. State lives in its own localStorage key so the
// older demo database format does not change.
import { caseAnswerSchema } from "@cyberpath/contracts";

const FEATURE_KEY = "cyberpath-demo-features-v1";

type CaseRow = { attempts: number; pointsAwarded: number; solvedAt: string | null };
type FeatureState = { cases: Record<string, Record<string, Record<string, CaseRow>>> };

function readState(): FeatureState {
  try {
    const parsed = JSON.parse(localStorage.getItem(FEATURE_KEY) || "null") as FeatureState | null;
    if (parsed && typeof parsed.cases === "object") return parsed;
  } catch {
    // Corrupt demo state is replaced below.
  }
  return { cases: {} };
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

  if (method === "GET" && path === "/cases") {
    return {
      cases: bank.investigationCases.map((item) => {
        const { evidence, questions, story: _story, ...meta } = bank.toPublicCase(item);
        return { ...meta, evidenceCount: evidence.length, questionCount: questions.length, progress: caseView(bank, item, mine[item.slug] ?? {}).progress };
      })
    };
  }

  const [, , slug, action] = path.split("/");
  const item = bank.findInvestigationCase(slug ?? "");
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

/** Returns a response for feature routes, or null so the main mock handles the path. */
export function handleFeatureRequest(method: string, path: string, body: unknown, userId: string | null): Promise<unknown> | null {
  if (path === "/cases" || path.startsWith("/cases/")) {
    if (!userId) return Promise.reject(new Error("Authentication required."));
    return handleCases(method, path, body, userId);
  }
  return null;
}
