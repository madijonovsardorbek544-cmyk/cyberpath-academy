const baseModules = [
  "Phase 1 foundations",
  "Technical core",
  "Blue team fundamentals",
  "Web and cloud basics",
  "Professionalization"
];

const pathFocus: Record<string, string[]> = {
  awareness: ["device hygiene", "phishing defense", "passwords and MFA", "safe browsing"],
  SOC: ["logging and monitoring", "SIEM concepts", "phishing triage", "incident response"],
  AppSec: ["how web apps work", "sessions and cookies", "OWASP-style risks", "secure coding"],
  "cloud security": ["cloud basics", "cloud IAM", "secrets management", "misconfiguration review"],
  "security engineering": ["Python and Bash", "secure configuration", "automation", "defense in depth"],
  GRC: ["risk assessment", "privacy basics", "business continuity", "documentation and policy"]
};

const experienceLift: Record<string, string[]> = {
  beginner: ["start with guided lessons", "complete every quick check", "use explain simply mode"],
  intermediate: ["take the placement quiz seriously", "skip mastered foundations only after scoring well", "start labs by week 2"],
  advanced: ["focus on specialization checkpoints", "use mistake notebook aggressively", "build a capstone by week 3"]
};

export function buildRoadmap(goal = "awareness", experienceLevel = "beginner", score = 0) {
  const focus = pathFocus[goal] || pathFocus.awareness;
  const lift = experienceLift[experienceLevel] || experienceLift.beginner;
  const pace = score >= 80 ? "accelerated" : score >= 50 ? "balanced" : "guided";
  return {
    goal,
    experienceLevel,
    score,
    pace,
    modules: baseModules.map((module, index) => ({
      week: index + 1,
      title: module,
      focus: focus[index % focus.length],
      successMetric: score >= 80
        ? "complete quiz at 85%+"
        : score >= 50
          ? "complete quiz at 80%+ with one retry"
          : "complete lesson, glossary review, and quiz at 75%+"
    })),
    advice: lift,
    specializationReady: score >= 65
  };
}
