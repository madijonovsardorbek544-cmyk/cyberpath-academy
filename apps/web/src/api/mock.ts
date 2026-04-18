import type { Analytics, Capstone, Lab, Lesson, QuizQuestion, Roadmap, User } from "../types";

type Role = User["role"];

type DemoUser = User & {
  password: string;
  resetToken?: string;
};

type Progress = {
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpentMinutes: number;
};

type QuizAttempt = {
  id: string;
  userId: string;
  lessonId: string;
  score: number;
  accuracy: number;
  difficulty: string;
  timeSpentMinutes: number;
  topicScores: Record<string, number>;
  review: Array<{
    id: string;
    prompt: string;
    type: string;
    explanation: string;
    yourAnswer: unknown;
    correctAnswer: unknown;
    isCorrect: boolean;
  }>;
  createdAt: string;
};

type MistakeItem = {
  id: string;
  userId: string;
  lessonId?: string;
  questionId?: string;
  topic: string;
  subtopic: string;
  prompt: string;
  explanation: string;
  userAnswer: unknown;
  correctAnswer: unknown;
  notes?: string;
  repeatCount: number;
  createdAt: string;
  lastSeenAt: string;
};

type MentorFeedback = {
  id: string;
  mentorId: string;
  studentId: string;
  message: string;
  createdAt: string;
};

type MentorLink = { mentorId: string; studentId: string };

type LabSubmission = {
  id: string;
  userId: string;
  labId: string;
  answers: Record<string, unknown>;
  score: number;
  feedback: string;
  createdAt: string;
};

type DemoDb = {
  users: DemoUser[];
  lessons: Lesson[];
  quizQuestions: QuizQuestion[];
  labs: Lab[];
  capstones: Capstone[];
  glossary: Array<{ term: string; definition: string; category: string }>;
  progress: Progress[];
  attempts: QuizAttempt[];
  mistakes: MistakeItem[];
  mentorFeedback: MentorFeedback[];
  mentorLinks: MentorLink[];
  labSubmissions: LabSubmission[];
  sessionUserId?: string;
};

const DB_KEY = "cyberpath-demo-db-v2";

const now = () => new Date().toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const lessonBlueprints = [
  { slug: "what-is-cybersecurity", title: "What Is Cybersecurity?", phase: 1, phaseTitle: "Foundations", level: "Beginner", orderIndex: 1, specialization: "awareness", concepts: ["cybersecurity scope", "people, process, technology", "defensive mindset", "authorized learning only"] },
  { slug: "cia-triad", title: "The CIA Triad", phase: 1, phaseTitle: "Foundations", level: "Beginner", orderIndex: 2, specialization: "awareness", concepts: ["confidentiality", "integrity", "availability", "trade-offs"] },
  { slug: "risk-assets-threats", title: "Assets, Threats, Vulnerabilities, and Risk", phase: 1, phaseTitle: "Foundations", level: "Beginner", orderIndex: 3, specialization: "awareness", concepts: ["assets", "threats", "vulnerabilities", "risk treatment"] },
  { slug: "identity-access-basics", title: "Authentication vs Authorization", phase: 1, phaseTitle: "Foundations", level: "Beginner", orderIndex: 4, specialization: "awareness", concepts: ["identity", "authentication", "authorization", "least privilege"] },
  { slug: "passwords-mfa-and-phishing", title: "Passwords, MFA, and Phishing Defense", phase: 1, phaseTitle: "Foundations", level: "Beginner", orderIndex: 5, specialization: "awareness", concepts: ["password hygiene", "mfa", "phishing", "backups"] },
  { slug: "device-hygiene", title: "Digital Safety and Device Hygiene", phase: 1, phaseTitle: "Foundations", level: "Beginner", orderIndex: 6, specialization: "awareness", concepts: ["updates", "device hygiene", "backups", "safe browsing"] },
  { slug: "computer-basics", title: "Computer Basics for Security", phase: 2, phaseTitle: "Technical Core", level: "Beginner", orderIndex: 1, specialization: "security engineering", concepts: ["hardware", "software", "memory", "storage"] },
  { slug: "operating-systems-and-files", title: "Operating Systems, Files, and Permissions", phase: 2, phaseTitle: "Technical Core", level: "Beginner", orderIndex: 2, specialization: "security engineering", concepts: ["operating systems", "file systems", "permissions", "processes"] },
  { slug: "linux-windows-basics", title: "Linux and Windows Basics", phase: 2, phaseTitle: "Technical Core", level: "Beginner", orderIndex: 3, specialization: "security engineering", concepts: ["linux basics", "windows basics", "logs", "users and groups"] },
  { slug: "networking-fundamentals", title: "Networking Fundamentals", phase: 2, phaseTitle: "Technical Core", level: "Intermediate", orderIndex: 4, specialization: "SOC", concepts: ["ip", "dns", "http and https", "ports and packets"] },
  { slug: "browser-and-web-basics", title: "Browser and Web Basics", phase: 2, phaseTitle: "Technical Core", level: "Intermediate", orderIndex: 5, specialization: "AppSec", concepts: ["browser", "request response", "cookies", "web basics"] },
  { slug: "python-bash-and-apis", title: "Python, Bash, JSON, APIs, and Regex", phase: 2, phaseTitle: "Technical Core", level: "Intermediate", orderIndex: 6, specialization: "security engineering", concepts: ["python basics", "bash basics", "json and apis", "regex"] },
  { slug: "least-privilege-and-defense-in-depth", title: "Least Privilege and Defense in Depth", phase: 3, phaseTitle: "Security Fundamentals and Blue Team", level: "Intermediate", orderIndex: 1, specialization: "SOC", concepts: ["least privilege", "defense in depth", "layered controls", "segmentation"] },
  { slug: "patching-vuln-management", title: "Patching and Vulnerability Management", phase: 3, phaseTitle: "Security Fundamentals and Blue Team", level: "Intermediate", orderIndex: 2, specialization: "SOC", concepts: ["patching cadence", "vulnerability management", "prioritization", "remediation workflow"] },
  { slug: "iam-encryption-and-keys", title: "IAM, Encryption, Hashing, Keys, and Certificates", phase: 3, phaseTitle: "Security Fundamentals and Blue Team", level: "Intermediate", orderIndex: 3, specialization: "cloud security", concepts: ["iam basics", "hashing vs encryption", "public and private keys", "certificates"] },
  { slug: "logging-siem-edr-ir", title: "Logging, SIEM, EDR, and Incident Response", phase: 3, phaseTitle: "Security Fundamentals and Blue Team", level: "Intermediate", orderIndex: 4, specialization: "incident responder", concepts: ["logging", "siem", "edr", "incident response lifecycle"] },
  { slug: "how-web-apps-work", title: "How Web Apps Work", phase: 4, phaseTitle: "Web, AppSec, and Cloud", level: "Intermediate", orderIndex: 1, specialization: "AppSec", concepts: ["browser", "server", "state", "apis"] },
  { slug: "sessions-cookies-and-auth-flows", title: "Sessions, Cookies, Tokens, and Auth Flows", phase: 4, phaseTitle: "Web, AppSec, and Cloud", level: "Intermediate", orderIndex: 2, specialization: "AppSec", concepts: ["sessions", "cookies", "tokens", "auth flows"] },
  { slug: "owasp-style-risks", title: "OWASP-Style Risks and Secure Coding", phase: 4, phaseTitle: "Web, AppSec, and Cloud", level: "Advanced", orderIndex: 3, specialization: "AppSec", concepts: ["broken access control", "misconfiguration", "injection", "logging failures"] },
  { slug: "cloud-iam-and-containers", title: "Cloud Basics, IAM, Secrets, and Containers", phase: 4, phaseTitle: "Web, AppSec, and Cloud", level: "Advanced", orderIndex: 4, specialization: "cloud security", concepts: ["cloud basics", "iam in cloud", "secrets management", "containers"] },
  { slug: "reporting-and-ethics", title: "Reporting, Documentation, and Ethics", phase: 5, phaseTitle: "Professionalization", level: "Intermediate", orderIndex: 1, specialization: "GRC", concepts: ["reporting", "documentation", "ethics", "authorization boundaries"] },
  { slug: "risk-privacy-bcdr", title: "Risk, Privacy, Business Continuity, and Disaster Recovery", phase: 5, phaseTitle: "Professionalization", level: "Intermediate", orderIndex: 2, specialization: "GRC", concepts: ["risk assessment", "privacy basics", "business continuity", "disaster recovery"] },
  { slug: "specialization-tracks", title: "Specialization Paths in Cybersecurity", phase: 5, phaseTitle: "Professionalization", level: "Intermediate", orderIndex: 3, specialization: "career", concepts: ["soc analyst", "security engineer", "appsec", "cloud security"] },
  { slug: "capstones-and-interview-prep", title: "Capstones, Portfolio Artifacts, and Interview Prep", phase: 5, phaseTitle: "Professionalization", level: "Advanced", orderIndex: 4, specialization: "career", concepts: ["capstones", "portfolio artifacts", "interview prep", "evidence"] }
];

const glossaryTerms = [
  ["Asset", "Anything valuable that an organization relies on, such as data, systems, people, or brand trust.", "Foundations"],
  ["Threat", "A possible cause of harm, such as an attacker, a natural event, or an internal mistake.", "Foundations"],
  ["Vulnerability", "A weakness that could be exploited or accidentally triggered.", "Foundations"],
  ["Risk", "The combination of likelihood and impact when a threat meets a vulnerability.", "Foundations"],
  ["Authentication", "Proving who you are.", "IAM"],
  ["Authorization", "Determining what you are allowed to do after identity is known.", "IAM"],
  ["Least Privilege", "Giving only the minimum access needed to do the job.", "IAM"],
  ["MFA", "Multiple factors used to strengthen login security.", "IAM"],
  ["DNS", "A system that translates domain names into IP addresses.", "Networking"],
  ["Port", "A numbered endpoint used by network services.", "Networking"],
  ["Packet", "A chunk of network data moving between systems.", "Networking"],
  ["Log", "A recorded event produced by a system or application.", "Blue Team"],
  ["SIEM", "A platform that aggregates and analyzes security event data.", "Blue Team"],
  ["EDR", "Endpoint detection and response tooling for monitoring and investigating endpoints.", "Blue Team"],
  ["Hashing", "A one-way function used for integrity and password storage workflows.", "Cryptography"],
  ["Encryption", "Reversible transformation of data using a key so authorized users can recover the original data.", "Cryptography"],
  ["Certificate", "A digitally signed document that helps systems trust a public key.", "Cryptography"],
  ["Cookie", "Small data stored by the browser to help manage state.", "Web"],
  ["Token", "A credential artifact used to represent identity or authorization.", "Web"],
  ["Broken Access Control", "When users can reach actions or data they should not be able to access.", "AppSec"],
  ["Misconfiguration", "Unsafe settings that increase exposure without any exploit magic being required.", "AppSec"],
  ["Secret", "Sensitive authentication material such as API keys or database passwords.", "Cloud"],
  ["Container", "A lightweight packaged environment for running applications with dependencies.", "Cloud"],
  ["Business Continuity", "Keeping critical business functions running during disruption.", "Professional"],
  ["Disaster Recovery", "Restoring systems and data after major disruption.", "Professional"],
  ["Phishing", "A social engineering attempt to trick a person into unsafe action.", "Awareness"],
  ["Incident Response", "The structured process for handling security incidents.", "Blue Team"],
  ["Patch", "A software update intended to fix bugs or security issues.", "Blue Team"],
  ["Regex", "A pattern language used to match text.", "Technical Core"],
  ["JSON", "A structured text format commonly used to exchange data between systems.", "Technical Core"]
] as const;

const labs: Lab[] = [
  { id: uid("lab"), slug: "log-analysis-auth-spikes", title: "Log Analysis: Authentication Spike", category: "Log analysis", difficulty: "Beginner", description: "Inspect fictional logs, classify suspicious events, and suggest a safe next step.", dataset: { lines: ["09:12 failed login for admin from 198.51.100.8", "09:13 failed login for admin from 198.51.100.8", "09:14 successful login for admin from 198.51.100.8"] }, tasks: [{ id: "task1", prompt: "What stands out in the log pattern?", expectedKeywords: ["failed login", "spike", "brute", "suspicious"] }, { id: "task2", prompt: "What is the safest immediate defensive action?", expectedKeywords: ["investigate", "reset", "mfa", "contain"] }], safeGuardrails: "Authorized toy data only. The point is detection and containment, not attack execution.", solutionOutline: "Flag repeated failures followed by success, validate legitimacy, rotate credentials, and review MFA and source IP context." },
  { id: uid("lab"), slug: "phishing-inbox-review", title: "Phishing Email Identification", category: "Phishing review", difficulty: "Beginner", description: "Review a fake inbox and label high-risk signs without touching any real target.", dataset: { subject: "Payroll action required", sender: "payroll-secure-help@fake-domain.example", body: "Urgent: verify payroll now." }, tasks: [{ id: "task1", prompt: "Name two phishing indicators.", expectedKeywords: ["urgent", "sender", "domain", "mismatch"] }, { id: "task2", prompt: "What should the user do next?", expectedKeywords: ["report", "do not click", "security team", "verify"] }], safeGuardrails: "Fictional phishing sample only. Focus on safe reporting and user protection.", solutionOutline: "Spot urgency, suspicious sender domain, and push for reporting through the right channel instead of interacting." },
  { id: uid("lab"), slug: "incident-triage-demo", title: "Incident Triage Simulation", category: "Incident triage", difficulty: "Intermediate", description: "Classify a fictional alert, estimate severity, and justify the next defensive action.", dataset: { alert: "EDR detected PowerShell execution from a finance workstation" }, tasks: [{ id: "task1", prompt: "What context do you need before escalating?", expectedKeywords: ["user", "process", "parent", "time", "host"] }, { id: "task2", prompt: "What safe first action makes sense?", expectedKeywords: ["validate", "contain", "isolate", "collect evidence"] }], safeGuardrails: "Toy alert only. Learn triage logic, not abuse workflows.", solutionOutline: "Ask for host, user, parent process, and timing context. Validate, then isolate only if justified by risk." },
  { id: uid("lab"), slug: "packet-analysis-fictional", title: "Packet Analysis with Fictional Data", category: "Packet analysis", difficulty: "Intermediate", description: "Review fictional network metadata and identify abnormal traffic without using real packet captures.", dataset: { flows: ["10.0.0.25 -> 203.0.113.20:4444", "10.0.0.25 -> 203.0.113.20:4444", "10.0.0.25 -> 198.51.100.5:443"] }, tasks: [{ id: "task1", prompt: "Which connection deserves review and why?", expectedKeywords: ["4444", "repeated", "abnormal", "review"] }, { id: "task2", prompt: "Name one benign explanation and one suspicious explanation.", expectedKeywords: ["legitimate", "service", "unauthorized", "unexpected"] }], safeGuardrails: "Fictional traffic only. The skill is interpretation, not offensive usage.", solutionOutline: "Flag repeated outbound port 4444 traffic and balance investigation with context." },
  { id: uid("lab"), slug: "secure-coding-toy-fix", title: "Secure Coding Toy Fix", category: "Secure coding review", difficulty: "Advanced", description: "Read a tiny toy code snippet and explain a safe remediation.", dataset: { code: "app.get('/admin', (req, res) => { return res.send(secretData); })" }, tasks: [{ id: "task1", prompt: "What is the likely issue?", expectedKeywords: ["access control", "authorization", "missing check"] }, { id: "task2", prompt: "What would a safe fix include?", expectedKeywords: ["authorize", "role", "least privilege", "check"] }], safeGuardrails: "Use toy code only. Focus on safe remediation and code review thinking.", solutionOutline: "Identify missing authorization and recommend an explicit role or permission check." },
  { id: uid("lab"), slug: "mock-cloud-iam-review", title: "Mock Cloud IAM Review", category: "Cloud/IAM review", difficulty: "Advanced", description: "Inspect a fake cloud dashboard summary and reduce excessive privilege.", dataset: { roles: [{ user: "intern-app", permission: "admin" }, { user: "billing-job", permission: "read-billing" }] }, tasks: [{ id: "task1", prompt: "Which assignment violates least privilege?", expectedKeywords: ["intern", "admin", "least privilege"] }, { id: "task2", prompt: "What should change?", expectedKeywords: ["reduce", "specific", "scope", "role"] }], safeGuardrails: "No real cloud accounts are involved. This is purely a defensive least-privilege review.", solutionOutline: "Downgrade the over-privileged identity and replace broad rights with scoped access." },
  { id: uid("lab"), slug: "misconfiguration-review-demo", title: "Demo Misconfiguration Review", category: "Misconfiguration review", difficulty: "Intermediate", description: "Review a fake server checklist and identify unsafe defaults.", dataset: { checklist: ["Default admin password unchanged", "Automatic updates disabled", "MFA enabled for admins"] }, tasks: [{ id: "task1", prompt: "Name two unsafe defaults.", expectedKeywords: ["default password", "updates disabled"] }, { id: "task2", prompt: "What remediation order makes sense?", expectedKeywords: ["password", "update", "mfa", "priority"] }], safeGuardrails: "The configuration is fictional. The point is safe review and prioritization.", solutionOutline: "Fix default credentials first, restore updates, and keep strong authentication in place." },
  { id: uid("lab"), slug: "demo-access-review", title: "Demo Access Control Review", category: "Access control review", difficulty: "Intermediate", description: "Inspect a toy app role matrix and spot broken access control.", dataset: { matrix: [{ role: "student", action: "view own progress", allowed: true }, { role: "student", action: "edit all users", allowed: true }] }, tasks: [{ id: "task1", prompt: "Which permission is wrong?", expectedKeywords: ["student", "edit all users", "wrong"] }, { id: "task2", prompt: "Which principle is violated?", expectedKeywords: ["least privilege", "authorization", "access control"] }], safeGuardrails: "This is a demo app. Focus on safe design review only.", solutionOutline: "Remove broad admin-like power from student role and enforce proper authorization." }
];

const capstones: Capstone[] = [
  { id: uid("cap"), title: "SOC Alert Triage Portfolio", specialization: "SOC analyst", summary: "Build a mini report pack that classifies fictional alerts, explains severity, and proposes next steps.", deliverables: ["triage worksheet", "evidence notes", "final incident summary"], difficulty: "Intermediate" },
  { id: uid("cap"), title: "Secure Web Review Journal", specialization: "AppSec analyst", summary: "Review a toy web app for broken access control, misconfiguration, and weak session handling.", deliverables: ["risk table", "remediation notes", "before-after explanation"], difficulty: "Advanced" },
  { id: uid("cap"), title: "Cloud IAM Hardening Blueprint", specialization: "cloud security", summary: "Shrink excessive permissions in a mock cloud environment and justify each change.", deliverables: ["role inventory", "least-privilege redesign", "executive summary"], difficulty: "Advanced" },
  { id: uid("cap"), title: "Incident Response Evidence Pack", specialization: "incident responder", summary: "Use fictional logs and host notes to produce a timeline and containment recommendation.", deliverables: ["timeline", "scope statement", "containment proposal"], difficulty: "Intermediate" },
  { id: uid("cap"), title: "Risk and Privacy Mini Assessment", specialization: "GRC analyst", summary: "Assess a fictional service for key risks, privacy concerns, and continuity requirements.", deliverables: ["risk register", "privacy observations", "continuity controls"], difficulty: "Intermediate" }
];

function buildRoadmap(goal = "awareness", experienceLevel = "beginner", score = 0): Roadmap {
  const baseModules = ["Phase 1 foundations", "Technical core", "Blue team fundamentals", "Web and cloud basics", "Professionalization"];
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
      successMetric: score >= 80 ? "complete quiz at 85%+" : score >= 50 ? "complete quiz at 80%+ with one retry" : "complete lesson, glossary review, and quiz at 75%+"
    })),
    advice: lift,
    specializationReady: score >= 65
  };
}

function buildLessonRecord(item: typeof lessonBlueprints[number]): Lesson {
  return {
    id: uid("lesson"),
    ...item,
    estimatedMinutes: 22,
    learningObjectives: [
      `Define ${item.concepts[0]} in plain language.`,
      `Explain how ${item.concepts[1]} affects defensive work.`,
      `Spot a common mistake around ${item.concepts[2]}.`,
      `Connect ${item.concepts[3]} to a real security workflow.`
    ],
    content: `${item.title} teaches the learner to think defensively, distinguish core terminology, and connect abstract cyber ideas to day-to-day work. This lesson explains ${item.concepts.join(", ")} with practical examples, safe analogies, and real-world defensive reasoning. Every section keeps the boundary clear: learn in authorized, sandboxed environments, document evidence carefully, and focus on reducing risk instead of chasing flashy attack narratives.`,
    glossary: item.concepts.map((concept) => ({ term: concept, definition: `${concept} explained in beginner-friendly language with defensive framing.` })),
    examples: [
      `Example 1: A learner sees ${item.concepts[0]} inside a simple toy scenario and labels it correctly.`,
      `Example 2: A team uses ${item.concepts[1]} to make a safer decision under time pressure.`,
      `Example 3: A review catches a mistake around ${item.concepts[2]} before it becomes incident fuel.`
    ],
    knowledgeChecks: [
      `In one sentence, explain ${item.concepts[0]}.`,
      `How would you teach ${item.concepts[1]} to a new teammate?`,
      `What is a realistic mistake involving ${item.concepts[2]}?`,
      `Why does ${item.concepts[3]} matter in real work?`
    ],
    commonMistakes: `Learners often memorize the phrase ${item.concepts[2]} without understanding when it changes the defensive decision. That is weak learning. Use context and evidence.`,
    whyItMatters: `${item.title} matters because professionals do not get paid for vague cyber vocabulary. They get paid for accurate judgment, clean communication, and safer decisions under pressure.`
  };
}

function buildQuestionsForLesson(lesson: Lesson, concepts: string[]): QuizQuestion[] {
  const baseId = lesson.id;
  return [
    {
      id: uid("qq"),
      lessonId: baseId,
      prompt: `Which option best matches ${concepts[0]} in this lesson?`,
      type: "multiple-choice",
      difficulty: lesson.level,
      topic: lesson.phaseTitle,
      subtopic: concepts[0],
      explanation: `${concepts[0]} is the most direct match based on the lesson definition.`,
      options: [
        { id: "a", label: `${concepts[0]} as the directly relevant concept` },
        { id: "b", label: `A loosely related but incorrect idea` },
        { id: "c", label: `A distracting detail that sounds technical` },
        { id: "d", label: `A broad answer with weak precision` }
      ],
      answer: "a"
    },
    {
      id: uid("qq"),
      lessonId: baseId,
      prompt: `Select all defensive ideas that align with ${concepts[1]} and ${concepts[3]}.`,
      type: "multi-select",
      difficulty: lesson.level,
      topic: lesson.phaseTitle,
      subtopic: concepts[1],
      explanation: `The correct options reinforce safer process and constrained decision-making.`,
      options: [
        { id: "a", label: "Use evidence and least-risk judgment" },
        { id: "b", label: "Skip documentation if you feel confident" },
        { id: "c", label: "Prefer authorized sandbox learning" },
        { id: "d", label: "Assume vague intuition is enough" }
      ],
      answer: ["a", "c"]
    },
    {
      id: uid("qq"),
      lessonId: baseId,
      prompt: `${concepts[2]} should be understood in context rather than memorized as empty jargon.`,
      type: "true-false",
      difficulty: lesson.level,
      topic: lesson.phaseTitle,
      subtopic: concepts[2],
      explanation: `True. Cyber learning gets useful only when terms connect to decisions and evidence.`,
      options: [],
      answer: true
    },
    {
      id: uid("qq"),
      lessonId: baseId,
      prompt: `In a short response, explain why ${concepts[3]} matters in real work.`,
      type: "short-response",
      difficulty: lesson.level,
      topic: lesson.phaseTitle,
      subtopic: concepts[3],
      explanation: `A strong answer mentions safer decisions, clearer communication, or reduced risk.`,
      options: [],
      answer: "reduced risk"
    }
  ];
}

function seedDb(): DemoDb {
  const lessons = lessonBlueprints.map(buildLessonRecord);
  const quizQuestions = lessons.flatMap((lesson) => buildQuestionsForLesson(lesson, lesson.glossary.map((entry) => entry.term)));

  const studentId = uid("user");
  const student2Id = uid("user");
  const mentorId = uid("user");
  const adminId = uid("user");

  const users: DemoUser[] = [
    { id: studentId, name: "Amina Student", email: "student@cyberpath.local", password: "Student123!", role: "student", goal: "SOC", experienceLevel: "beginner", placementScore: 58, roadmapJson: buildRoadmap("SOC", "beginner", 58), streakDays: 4 },
    { id: student2Id, name: "Leo Learner", email: "student2@cyberpath.local", password: "Student123!", role: "student", goal: "AppSec", experienceLevel: "intermediate", placementScore: 72, roadmapJson: buildRoadmap("AppSec", "intermediate", 72), streakDays: 2 },
    { id: mentorId, name: "Mira Mentor", email: "mentor@cyberpath.local", password: "Mentor123!", role: "mentor" },
    { id: adminId, name: "Alex Admin", email: "admin@cyberpath.local", password: "Admin123!", role: "admin" }
  ];

  const progress: Progress[] = lessons.slice(0, 8).map((lesson, index) => ({
    userId: studentId,
    lessonId: lesson.id,
    completed: index < 6,
    completedAt: index < 6 ? daysAgo(6 - index) : undefined,
    timeSpentMinutes: 20 + index * 8
  }));

  const attempts: QuizAttempt[] = lessons.slice(0, 8).map((lesson, index) => ({
    id: uid("attempt"),
    userId: studentId,
    lessonId: lesson.id,
    score: index < 5 ? 85 : 65,
    accuracy: (index < 5 ? 85 : 65) / 100,
    difficulty: index < 5 ? "confident" : "developing",
    timeSpentMinutes: 10 + index,
    topicScores: { [lesson.phaseTitle]: index < 5 ? 82 : 68 },
    review: [],
    createdAt: daysAgo(6 - index)
  }));

  const weakQuestions = quizQuestions.slice(0, 3);
  const mistakes: MistakeItem[] = weakQuestions.map((question, idx) => ({
    id: uid("mistake"),
    userId: studentId,
    lessonId: question.lessonId,
    questionId: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
    prompt: question.prompt,
    explanation: question.explanation,
    userAnswer: "demo wrong answer",
    correctAnswer: question.answer,
    repeatCount: idx === 1 ? 3 : 2,
    createdAt: daysAgo(idx + 1),
    lastSeenAt: daysAgo(idx + 1),
    notes: idx === 0 ? "I confused the core definition with a broad related term." : ""
  }));

  const labSubmissions: LabSubmission[] = labs.slice(0, 3).map((lab, idx) => ({
    id: uid("labsub"),
    userId: studentId,
    labId: lab.id,
    answers: { sample: "demo" },
    score: 78 - idx * 3,
    feedback: "Good defensive instincts. Tighten evidence collection and be more explicit about the next safe action.",
    createdAt: daysAgo(idx + 1)
  }));

  const mentorFeedback: MentorFeedback[] = [
    { id: uid("feedback"), mentorId, studentId, message: "Strong momentum. Your triage reasoning is improving, but your terminology is still slightly loose in IAM and risk.", createdAt: daysAgo(1) },
    { id: uid("feedback"), mentorId, studentId: student2Id, message: "Good AppSec intuition. Next step: explain broken access control more precisely and document safer fixes.", createdAt: daysAgo(2) }
  ];

  return {
    users,
    lessons,
    quizQuestions,
    labs,
    capstones,
    glossary: glossaryTerms.map(([term, definition, category]) => ({ term, definition, category })),
    progress,
    attempts,
    mistakes,
    mentorFeedback,
    mentorLinks: [
      { mentorId, studentId },
      { mentorId, studentId: student2Id }
    ],
    labSubmissions,
    sessionUserId: studentId
  };
}

function readDb(): DemoDb {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedDb();
    writeDb(seeded);
    return seeded;
  }
  return JSON.parse(raw) as DemoDb;
}

function writeDb(db: DemoDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getSessionUser(db: DemoDb): DemoUser | null {
  if (!db.sessionUserId) return null;
  return db.users.find((user) => user.id === db.sessionUserId) || null;
}

function sanitizeUser(user: DemoUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    goal: user.goal,
    experienceLevel: user.experienceLevel,
    placementScore: user.placementScore,
    roadmapJson: user.roadmapJson,
    streakDays: user.streakDays
  };
}

function requireUser(db: DemoDb): DemoUser {
  const user = getSessionUser(db);
  if (!user) throw new Error("Authentication required.");
  return user;
}

function computeAnalytics(db: DemoDb, userId: string): Analytics {
  const progress = db.progress.filter((entry) => entry.userId === userId);
  const attempts = db.attempts.filter((entry) => entry.userId === userId);
  const mistakes = db.mistakes.filter((entry) => entry.userId === userId);
  const labSubmissions = db.labSubmissions.filter((entry) => entry.userId === userId);
  const totalCompleted = progress.filter((entry) => entry.completed).length;
  const completionRate = db.lessons.length ? Math.round((totalCompleted / db.lessons.length) * 100) : 0;
  const totalQuizAccuracy = attempts.length ? Math.round((attempts.reduce((sum, item) => sum + item.accuracy, 0) / attempts.length) * 100) : 0;
  const timeStudied = progress.reduce((sum, item) => sum + item.timeSpentMinutes, 0) + attempts.reduce((sum, item) => sum + item.timeSpentMinutes, 0);

  const mistakesByTopic = mistakes.reduce<Record<string, number>>((acc, item) => {
    acc[item.topic] = (acc[item.topic] || 0) + item.repeatCount;
    return acc;
  }, {});

  const weakTopics = Object.entries(mistakesByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, misses]) => ({ topic, misses }));

  const quizByTopic = attempts.reduce<Record<string, { total: number; score: number }>>((acc, item) => {
    Object.entries(item.topicScores).forEach(([topic, score]) => {
      if (!acc[topic]) acc[topic] = { total: 0, score: 0 };
      acc[topic].total += 1;
      acc[topic].score += score;
    });
    return acc;
  }, {});

  const topicAccuracy = Object.entries(quizByTopic).map(([topic, value]) => ({ topic, accuracy: Math.round(value.score / value.total) }));

  const skillRadar = ["Foundations", "Technical Core", "Security Fundamentals and Blue Team", "Web, AppSec, and Cloud", "Professionalization"].map((label) => {
    const related = topicAccuracy.filter((item) => item.topic.toLowerCase().includes(label.toLowerCase().split(",")[0].split(" ")[0]));
    const value = related.length ? Math.round(related.reduce((sum, item) => sum + item.accuracy, 0) / related.length) : 40;
    return { skill: label, value };
  });

  const completedDates = progress.filter((item) => item.completedAt).map((item) => item.completedAt!.slice(0, 10));
  const streakDays = computeStreak(completedDates);

  return {
    totalCompleted,
    completionRate,
    totalQuizAccuracy,
    weakTopics,
    topicAccuracy,
    timeStudied,
    streakDays,
    milestones: [
      { label: "Foundations started", done: totalCompleted >= 1 },
      { label: "Five lessons completed", done: totalCompleted >= 5 },
      { label: "Four labs attempted", done: labSubmissions.length >= 4 },
      { label: "Specialization readiness", done: completionRate >= 45 && totalQuizAccuracy >= 75 },
      { label: "Capstone readiness", done: completionRate >= 70 && totalQuizAccuracy >= 80 }
    ],
    readiness: {
      specialization: Math.min(100, Math.round(completionRate * 0.55 + totalQuizAccuracy * 0.45)),
      capstone: Math.min(100, Math.round(completionRate * 0.65 + totalQuizAccuracy * 0.35))
    },
    skillRadar
  };
}

function computeStreak(days: string[]) {
  const unique = Array.from(new Set(days)).sort();
  if (!unique.length) return 0;
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (unique.includes(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function isAnswerCorrect(expectedValue: unknown, actualValue: unknown, type: string) {
  if (type === "multi-select") {
    const expected = [...((expectedValue as string[]) || [])].sort();
    const actual = [...(((actualValue as string[]) || []))].sort();
    return JSON.stringify(expected) === JSON.stringify(actual);
  }
  if (type === "short-response") {
    const expected = String(expectedValue || "").toLowerCase();
    const actual = String(actualValue || "").toLowerCase();
    return actual.includes(expected) || expected.includes(actual);
  }
  return JSON.stringify(expectedValue) === JSON.stringify(actualValue);
}

async function respond<T>(fn: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return fn();
}

function ensureRole(user: DemoUser, roles: Role[]) {
  if (!roles.includes(user.role)) throw new Error("You do not have access to this resource.");
}

const unsafePatterns = ["credential theft", "keylogger", "persistence", "deploy malware", "steal password", "evade detection", "ransomware", "exploit live target", "phish real users", "bypass mfa"];

export const mockApi = {
  get: <T>(path: string) => respond(() => handleGet<T>(path)),
  post: <T>(path: string, body?: unknown) => respond(() => handlePost<T>(path, body)),
  patch: <T>(path: string, body?: unknown) => respond(() => handlePatch<T>(path, body)),
  delete: <T>(path: string) => respond(() => handleDelete<T>(path))
};

function handleGet<T>(path: string): T {
  const db = readDb();
  const user = getSessionUser(db);

  if (path === "/auth/me") {
    if (!user) throw new Error("Authentication required.");
    return { user: sanitizeUser(user) } as T;
  }

  if (path === "/learning/dashboard") {
    const authUser = requireUser(db);
    const analytics = computeAnalytics(db, authUser.id);
    const nextLessons = db.lessons
      .slice()
      .sort((a, b) => a.phase - b.phase || a.orderIndex - b.orderIndex)
      .slice(0, 4)
      .map((lesson) => {
        const progress = db.progress.find((entry) => entry.userId === authUser.id && entry.lessonId === lesson.id);
        return { ...lesson, completed: progress?.completed || false, timeSpentMinutes: progress?.timeSpentMinutes || 0 };
      });
    const mentorFeedback = db.mentorFeedback.filter((item) => item.studentId === authUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
    return { analytics, roadmap: authUser.roadmapJson || null, nextLessons, mentorFeedback, capstones: db.capstones } as T;
  }

  if (path === "/learning/paths") {
    const phases = Array.from(new Set(db.lessons.map((lesson) => lesson.phase))).map((phase) => ({
      phase,
      title: db.lessons.find((lesson) => lesson.phase === phase)?.phaseTitle || `Phase ${phase}`,
      lessons: db.lessons.filter((lesson) => lesson.phase === phase).sort((a, b) => a.orderIndex - b.orderIndex)
    }));
    return { phases, capstones: db.capstones, glossary: db.glossary.slice(0, 30), labs: db.labs } as T;
  }

  if (path === "/learning/mistakes") {
    const authUser = requireUser(db);
    return { mistakes: db.mistakes.filter((item) => item.userId === authUser.id).sort((a, b) => b.repeatCount - a.repeatCount) } as T;
  }

  if (path === "/learning/mistakes/review-quiz") {
    const authUser = requireUser(db);
    const mistakes = db.mistakes.filter((item) => item.userId === authUser.id).slice(0, 10);
    return { quiz: mistakes.map((mistake, index) => ({ id: `review-${index}`, type: "short-response", topic: mistake.topic, prompt: `Review prompt: ${mistake.prompt}`, explanation: mistake.explanation, correctAnswer: mistake.correctAnswer })) } as T;
  }

  if (path === "/learning/labs") {
    requireUser(db);
    return { labs: db.labs } as T;
  }

  if (path.startsWith("/learning/labs/")) {
    requireUser(db);
    const slug = path.split("/").pop()!;
    const lab = db.labs.find((item) => item.slug === slug);
    if (!lab) throw new Error("Lab not found.");
    return { lab } as T;
  }

  if (path.startsWith("/learning/lessons/")) {
    const authUser = requireUser(db);
    const slug = path.split("/").pop()!;
    const lesson = db.lessons.find((item) => item.slug === slug);
    if (!lesson) throw new Error("Lesson not found.");
    const progress = db.progress.find((entry) => entry.userId === authUser.id && entry.lessonId === lesson.id);
    const quizQuestions = db.quizQuestions.filter((question) => question.lessonId === lesson.id);
    return { lesson: { ...lesson, quizQuestions, completed: progress?.completed || false, timeSpentMinutes: progress?.timeSpentMinutes || 0 } } as T;
  }

  if (path === "/mentor/students") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const links = authUser.role === "admin" ? db.users.filter((item) => item.role === "student").map((item) => ({ studentId: item.id })) : db.mentorLinks.filter((link) => link.mentorId === authUser.id);
    const students = links.map((link) => {
      const student = db.users.find((item) => item.id === link.studentId)!;
      return { ...sanitizeUser(student), analytics: computeAnalytics(db, student.id) };
    });
    return { students } as T;
  }

  if (path === "/mentor/feedback") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const items = db.mentorFeedback
      .filter((item) => authUser.role === "admin" || item.mentorId === authUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => ({ ...item, student: sanitizeUser(db.users.find((userItem) => userItem.id === item.studentId)!) }));
    return { feedback: items } as T;
  }

  if (path === "/admin/overview") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["admin"]);
    const completionCount = db.progress.filter((item) => item.completed).length;
    const completionRate = db.lessons.length && db.users.filter((item) => item.role === "student").length
      ? Math.round((completionCount / (db.lessons.length * db.users.filter((item) => item.role === "student").length)) * 100)
      : 0;
    return {
      stats: {
        users: db.users.length,
        students: db.users.filter((item) => item.role === "student").length,
        mentors: db.users.filter((item) => item.role === "mentor").length,
        admins: db.users.filter((item) => item.role === "admin").length,
        lessons: db.lessons.length,
        labs: db.labs.length,
        attempts: db.attempts.length,
        feedbackItems: db.mentorFeedback.length,
        completionRate
      },
      users: db.users.map(sanitizeUser),
      lessons: db.lessons,
      labs: db.labs
    } as T;
  }

  throw new Error(`No mock GET handler for ${path}`);
}

function handlePost<T>(path: string, body: unknown): T {
  const db = readDb();

  if (path === "/auth/login") {
    const data = body as { email: string; password: string };
    const user = db.users.find((item) => item.email.toLowerCase() === data.email.toLowerCase());
    if (!user || user.password !== data.password) throw new Error("Invalid credentials.");
    db.sessionUserId = user.id;
    writeDb(db);
    return { user: sanitizeUser(user) } as T;
  }

  if (path === "/auth/signup") {
    const data = body as { name: string; email: string; password: string };
    if (db.users.some((item) => item.email.toLowerCase() === data.email.toLowerCase())) throw new Error("An account with that email already exists.");
    const user: DemoUser = { id: uid("user"), name: data.name, email: data.email.toLowerCase(), password: data.password, role: "student" };
    db.users.push(user);
    db.sessionUserId = user.id;
    writeDb(db);
    return { user: sanitizeUser(user) } as T;
  }

  if (path === "/auth/logout") {
    db.sessionUserId = undefined;
    writeDb(db);
    return { message: "Logged out." } as T;
  }

  if (path === "/auth/request-password-reset") {
    const data = body as { email: string };
    const user = db.users.find((item) => item.email.toLowerCase() === data.email.toLowerCase());
    if (user) {
      user.resetToken = crypto.randomUUID().replace(/-/g, "");
      writeDb(db);
      return { message: "Password reset token created.", devResetToken: user.resetToken } as T;
    }
    return { message: "If that account exists, a reset token has been created." } as T;
  }

  if (path === "/auth/reset-password") {
    const data = body as { token: string; password: string };
    const user = db.users.find((item) => item.resetToken === data.token);
    if (!user) throw new Error("Reset token is invalid or expired.");
    user.password = data.password;
    user.resetToken = undefined;
    writeDb(db);
    return { message: "Password updated. You can now log in." } as T;
  }

  if (path === "/learning/onboarding") {
    const authUser = requireUser(db);
    const data = body as { goal: string; experienceLevel: string; score: number };
    authUser.goal = data.goal;
    authUser.experienceLevel = data.experienceLevel;
    authUser.placementScore = data.score;
    authUser.roadmapJson = buildRoadmap(data.goal, data.experienceLevel, data.score);
    writeDb(db);
    return { user: sanitizeUser(authUser), roadmap: authUser.roadmapJson } as T;
  }

  if (path.startsWith("/learning/lessons/") && path.endsWith("/complete")) {
    const authUser = requireUser(db);
    const parts = path.split("/");
    const lessonId = parts[3];
    const data = body as { completed: boolean; timeSpentMinutes: number };
    const existing = db.progress.find((item) => item.userId === authUser.id && item.lessonId === lessonId);
    if (existing) {
      existing.completed = data.completed;
      existing.completedAt = data.completed ? now() : undefined;
      existing.timeSpentMinutes += data.timeSpentMinutes;
    } else {
      db.progress.push({ userId: authUser.id, lessonId, completed: data.completed, completedAt: data.completed ? now() : undefined, timeSpentMinutes: data.timeSpentMinutes });
    }
    writeDb(db);
    return { progress: db.progress.find((item) => item.userId === authUser.id && item.lessonId === lessonId) } as T;
  }

  if (path === "/learning/quizzes/submit") {
    const authUser = requireUser(db);
    const data = body as { lessonId: string; answers: Record<string, unknown>; timeSpentMinutes: number };
    const questions = db.quizQuestions.filter((item) => item.lessonId === data.lessonId);
    if (!questions.length) throw new Error("No quiz found for this lesson.");
    let correct = 0;
    const topicScores: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    const review: QuizAttempt["review"] = [];

    questions.forEach((question) => {
      const actual = data.answers[question.id];
      const isCorrect = isAnswerCorrect(question.answer, actual, question.type);
      if (isCorrect) correct += 1;
      topicCounts[question.topic] = (topicCounts[question.topic] || 0) + 1;
      topicScores[question.topic] = (topicScores[question.topic] || 0) + (isCorrect ? 100 : 0);
      if (!isCorrect) {
        const existing = db.mistakes.find((item) => item.userId === authUser.id && item.questionId === question.id);
        if (existing) {
          existing.repeatCount += 1;
          existing.lastSeenAt = now();
          existing.userAnswer = actual;
        } else {
          db.mistakes.push({
            id: uid("mistake"),
            userId: authUser.id,
            lessonId: data.lessonId,
            questionId: question.id,
            topic: question.topic,
            subtopic: question.subtopic,
            prompt: question.prompt,
            explanation: question.explanation,
            userAnswer: actual,
            correctAnswer: question.answer,
            repeatCount: 1,
            createdAt: now(),
            lastSeenAt: now(),
            notes: ""
          });
        }
      }
      review.push({ id: question.id, prompt: question.prompt, type: question.type, explanation: question.explanation, yourAnswer: actual, correctAnswer: question.answer, isCorrect });
    });

    const normalizedTopicScores = Object.fromEntries(Object.entries(topicScores).map(([topic, score]) => [topic, Math.round(score / (topicCounts[topic] || 1))]));
    const score = Math.round((correct / questions.length) * 100);
    const difficulty = score >= 85 ? "confident" : score >= 65 ? "developing" : "needs reinforcement";
    const attempt: QuizAttempt = { id: uid("attempt"), userId: authUser.id, lessonId: data.lessonId, score, accuracy: score / 100, difficulty, timeSpentMinutes: data.timeSpentMinutes, topicScores: normalizedTopicScores, review, createdAt: now() };
    db.attempts.push(attempt);
    writeDb(db);
    return { attempt, result: { score, correct, total: questions.length, difficulty, topicScores: normalizedTopicScores, review } } as T;
  }

  if (path.startsWith("/learning/labs/") && path.endsWith("/submit")) {
    const authUser = requireUser(db);
    const parts = path.split("/");
    const labId = parts[3];
    const lab = db.labs.find((item) => item.id === labId);
    if (!lab) throw new Error("Lab not found.");
    const data = body as { answers: Record<string, unknown> };
    let score = 0;
    const feedback = lab.tasks.map((task) => {
      const answer = String(data.answers[task.id] || "").toLowerCase();
      const matched = task.expectedKeywords.some((keyword) => answer.includes(keyword.toLowerCase()));
      if (matched) score += Math.round(100 / lab.tasks.length);
      return `${task.prompt}: ${matched ? "good defensive judgment" : "needs stronger evidence and safer reasoning"}`;
    }).join(" | ");
    const submission: LabSubmission = { id: uid("labsub"), userId: authUser.id, labId: lab.id, answers: data.answers, score: Math.min(100, score), feedback, createdAt: now() };
    db.labSubmissions.push(submission);
    writeDb(db);
    return { submission } as T;
  }

  if (path === "/ai/tutor") {
    const authUser = requireUser(db);
    const data = body as { prompt: string; mode: "simple" | "deep" };
    const prompt = data.prompt.toLowerCase();
    if (unsafePatterns.some((pattern) => prompt.includes(pattern))) {
      return {
        answer: "I cannot help with offensive or harmful cyber activity. I can help you learn defensively in safe, authorized toy environments instead. Try asking for phishing identification, log analysis, secure coding review, or incident triage.",
        recommendations: ["Open a safe lab", "Review ethics and authorization boundaries", "Ask for defensive detection guidance"]
      } as T;
    }
    const analytics = computeAnalytics(db, authUser.id);
    const matches = db.lessons
      .map((lesson) => ({ lesson, score: prompt.split(/\s+/).filter((word) => word.length > 2).reduce((sum, word) => sum + (lesson.title.toLowerCase().includes(word) || lesson.content.toLowerCase().includes(word) ? 1 : 0), 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.lesson);
    const detail = data.mode === "simple" ? 180 : 320;
    const answer = [
      data.mode === "simple" ? "Plain language:" : "Deep explanation:",
      matches.length ? matches.map((lesson) => `${lesson.title}: ${lesson.content.slice(0, detail)}...`).join(" ") : "I do not have a perfect direct match, so I am answering from the course structure and safe defensive principles.",
      analytics.weakTopics.length ? `Your current weakest areas are ${analytics.weakTopics.map((item) => item.topic).join(", ")}.` : "You do not have enough mistakes logged yet to identify weak areas confidently."
    ].join(" ");
    return { answer, recommendations: ["Review your weakest topic", "Complete one lesson quiz", "Attempt a safe lab"] } as T;
  }

  if (path === "/mentor/feedback") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const data = body as { studentId: string; message: string };
    if (authUser.role === "mentor" && !db.mentorLinks.some((link) => link.mentorId === authUser.id && link.studentId === data.studentId)) {
      throw new Error("You can only leave feedback for assigned students.");
    }
    const item: MentorFeedback = { id: uid("feedback"), mentorId: authUser.id, studentId: data.studentId, message: data.message, createdAt: now() };
    db.mentorFeedback.push(item);
    writeDb(db);
    return { feedback: item } as T;
  }

  if (path === "/admin/lessons") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["admin"]);
    const data = body as Omit<Lesson, "id" | "estimatedMinutes"> & { estimatedMinutes?: number };
    const lesson: Lesson = { ...data, id: uid("lesson"), estimatedMinutes: data.estimatedMinutes || 20 };
    db.lessons.push(lesson);
    writeDb(db);
    return { lesson } as T;
  }

  if (path === "/admin/labs") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["admin"]);
    const data = body as Omit<Lab, "id">;
    const lab: Lab = { ...data, id: uid("lab") };
    db.labs.push(lab);
    writeDb(db);
    return { lab } as T;
  }

  throw new Error(`No mock POST handler for ${path}`);
}

function handlePatch<T>(path: string, body: unknown): T {
  const db = readDb();
  const authUser = requireUser(db);

  if (path.startsWith("/learning/mistakes/")) {
    const id = path.split("/").pop()!;
    const mistake = db.mistakes.find((item) => item.id === id && item.userId === authUser.id);
    if (!mistake) throw new Error("Mistake not found.");
    mistake.notes = (body as { notes: string }).notes;
    writeDb(db);
    return { mistake } as T;
  }

  if (path.startsWith("/admin/users/") && path.endsWith("/role")) {
    ensureRole(authUser, ["admin"]);
    const id = path.split("/")[3];
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new Error("User not found.");
    user.role = (body as { role: Role }).role;
    writeDb(db);
    return { user: sanitizeUser(user) } as T;
  }

  if (path.startsWith("/admin/lessons/")) {
    ensureRole(authUser, ["admin"]);
    const id = path.split("/").pop()!;
    const lesson = db.lessons.find((item) => item.id === id);
    if (!lesson) throw new Error("Lesson not found.");
    Object.assign(lesson, body as Partial<Lesson>);
    writeDb(db);
    return { lesson } as T;
  }

  if (path.startsWith("/admin/labs/")) {
    ensureRole(authUser, ["admin"]);
    const id = path.split("/").pop()!;
    const lab = db.labs.find((item) => item.id === id);
    if (!lab) throw new Error("Lab not found.");
    Object.assign(lab, body as Partial<Lab>);
    writeDb(db);
    return { lab } as T;
  }

  throw new Error(`No mock PATCH handler for ${path}`);
}

function handleDelete<T>(path: string): T {
  const db = readDb();
  const authUser = requireUser(db);
  ensureRole(authUser, ["admin"]);

  if (path.startsWith("/admin/lessons/")) {
    const id = path.split("/").pop()!;
    db.lessons = db.lessons.filter((item) => item.id !== id);
    db.quizQuestions = db.quizQuestions.filter((item) => item.lessonId !== id);
    db.progress = db.progress.filter((item) => item.lessonId !== id);
    writeDb(db);
    return { message: "Lesson deleted." } as T;
  }

  if (path.startsWith("/admin/labs/")) {
    const id = path.split("/").pop()!;
    db.labs = db.labs.filter((item) => item.id !== id);
    db.labSubmissions = db.labSubmissions.filter((item) => item.labId !== id);
    writeDb(db);
    return { message: "Lab deleted." } as T;
  }

  throw new Error(`No mock DELETE handler for ${path}`);
}
