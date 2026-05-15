export type RubricCategory = 'evidence' | 'risk' | 'defensiveNextStep' | 'clarity' | 'safetyAuthorization';

export const defaultRubricWeights: Record<RubricCategory, number> = {
  evidence: 25,
  risk: 20,
  defensiveNextStep: 25,
  clarity: 15,
  safetyAuthorization: 15
};

const unsafeTerms = ['exploit', 'steal', 'bypass', 'credential theft', 'malware', 'persistence', 'evasion', 'phish users', 'hack into', 'dump passwords', 'exfiltrate'];
const riskTerms = ['risk', 'impact', 'because', 'could', 'unauthorized', 'suspicious', 'weakness', 'exposure', 'priority'];
const defensiveTerms = ['validate', 'document', 'report', 'contain', 'escalate', 'review', 'reset', 'mfa', 'least privilege', 'monitor', 'patch', 'verify', 'investigate'];
const safetyTerms = ['authorized', 'fictional', 'safe', 'defensive', 'do not', 'no live', 'permission', 'only'];

export function scoreLabSubmission(tasks: Array<Record<string, any>>, answers: Record<string, unknown>, solutionOutline: string) {
  const taskFeedback: string[] = [];
  const missingEvidence = new Set<string>();
  const categoryRaw: Record<RubricCategory, number[]> = { evidence: [], risk: [], defensiveNextStep: [], clarity: [], safetyAuthorization: [] };
  let unsafeDetected = false;

  for (const task of tasks) {
    const expectedEvidence = (task.expectedEvidence ?? task.expectedKeywords ?? []) as string[];
    const prompt = String(task.prompt ?? task.id ?? 'Task');
    const answer = String(answers[String(task.id)] ?? '').toLowerCase();
    const matchedEvidence = expectedEvidence.filter((item) => answer.includes(String(item).toLowerCase()));
    expectedEvidence.filter((item) => !matchedEvidence.includes(item)).forEach((item) => missingEvidence.add(item));

    const unsafe = unsafeTerms.some((term) => answer.includes(term));
    unsafeDetected = unsafeDetected || unsafe;
    const clarityScore = answer.trim().length >= 40 ? 1 : answer.trim().length >= 15 ? 0.55 : 0.15;
    const evidenceScore = expectedEvidence.length ? matchedEvidence.length / expectedEvidence.length : clarityScore;
    const riskScore = riskTerms.some((term) => answer.includes(term)) ? 1 : answer.includes('why') ? 0.7 : 0.25;
    const defensiveScore = defensiveTerms.some((term) => answer.includes(term)) ? 1 : 0.25;
    const safetyScore = unsafe ? 0 : safetyTerms.some((term) => answer.includes(term)) ? 1 : 0.65;

    categoryRaw.evidence.push(evidenceScore);
    categoryRaw.risk.push(riskScore);
    categoryRaw.defensiveNextStep.push(defensiveScore);
    categoryRaw.clarity.push(clarityScore);
    categoryRaw.safetyAuthorization.push(safetyScore);

    taskFeedback.push(`${prompt}: ${unsafe ? 'Unsafe/offensive framing detected. Redirect to authorized defensive analysis.' : matchedEvidence.length ? 'Good evidence use; strengthen risk and next-step language where needed.' : 'Needs more direct evidence from the fictional dataset.'}`);
  }

  const categoryScores = Object.fromEntries(Object.entries(defaultRubricWeights).map(([category, weight]) => {
    const scores = categoryRaw[category as RubricCategory];
    const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    const adjusted = unsafeDetected && category !== 'safetyAuthorization' ? Math.min(average, 0.55) : average;
    return [category, Math.round(adjusted * weight)];
  })) as Record<RubricCategory, number>;

  const totalScore = Math.max(0, Math.min(100, Object.values(categoryScores).reduce((sum, value) => sum + value, 0)));
  return {
    totalScore,
    categoryScores,
    taskFeedback,
    missingEvidence: [...missingEvidence].slice(0, 12),
    recommendedReview: unsafeDetected
      ? 'Review ethics, authorization boundaries, and defensive incident-response writing before retrying.'
      : totalScore >= 80 ? 'Strong submission. Convert this into a portfolio artifact or mentor review note.' : 'Retry with more exact evidence, clearer risk reasoning, and a concrete defensive next step.',
    solutionOutline,
    safetyRedirect: unsafeDetected ? 'CyberPath labs are defensive-only. Do not describe harmful action; document evidence, impact, and authorized response.' : null
  };
}
