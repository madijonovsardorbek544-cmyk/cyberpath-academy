import type { Analytics, Capstone, Certificate, Cohort, FeedbackItem, GuidedProject, Lab, LearnerProject, Lesson, MentorAlert, MentorAssignment, PilotLead, Plan, PortfolioArtifact, QuizQuestion, Recommendation, ReviewItem, Roadmap, Subscription, Track, User, SkillMasteryRecord, MasteryState, PracticeMode, Exercise } from "../types";
import { exerciseCatalog, isExerciseCorrect, skillCatalog, skillCategories } from "../learningContent";

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

type SkillExerciseAttempt = { id: string; userId: string; skillId: string; exerciseId: string; mode: PracticeMode; isCorrect: boolean; scoreDelta: number; createdAt: string };

type WaitlistSubmission = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string | null;
  countryCity?: string | null;
  studentCount?: number | null;
  interestLevel: string;
  message?: string | null;
  createdAt: string;
};

type AnalyticsEvent = { id: string; eventName: string; role?: string; createdAt: string };

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
  skillMastery: SkillMasteryRecord[];
  skillExerciseAttempts: SkillExerciseAttempt[];
  portfolio: PortfolioArtifact[];
  certificates: Certificate[];
  guidedProjects: GuidedProject[];
  learnerProjects: LearnerProject[];
  mentorAssignments: MentorAssignment[];
  mentorAlerts: MentorAlert[];
  cohorts: Cohort[];
  feedback: FeedbackItem[];
  waitlist: WaitlistSubmission[];
  pilotLeads: PilotLead[];
  analyticsEvents: AnalyticsEvent[];
  subscriptions: Subscription[];
  sessionUserId?: string;
};

const DB_VERSION = 6;
export const DB_KEY = `cyberpath-demo-db-v${DB_VERSION}`;
const LEGACY_DB_KEYS = ["cyberpath-demo-db-v1", "cyberpath-demo-db-v2", "cyberpath-demo-db-v3", "cyberpath-demo-db-v4", "cyberpath-demo-db-v5"];

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
  { id: uid("lab"), slug: "demo-access-review", title: "Demo Access Control Review", category: "Access control review", difficulty: "Intermediate", description: "Inspect a toy app role matrix and spot broken access control.", scenarioBriefing: "A fictional school portal is being reviewed before a class pilot.", fictionalDatasetLabel: "Toy role matrix", evidenceChecklist: ["over-broad student permission", "least-privilege violation", "safe remediation"], artifactSuggestion: { type: "access-review-memo", title: "Access review memo", prompt: "Summarize the incorrect permission, risk, and safe least-privilege change." }, dataset: { matrix: [{ role: "student", action: "view own progress", allowed: true }, { role: "student", action: "edit all users", allowed: true }] }, tasks: [{ id: "task1", prompt: "Which permission is wrong?", expectedKeywords: ["student", "edit all users", "wrong"], hints: ["Compare learner permissions with administrator actions."] }, { id: "task2", prompt: "Which principle is violated?", expectedKeywords: ["least privilege", "authorization", "access control"], hints: ["Name the defensive design principle, not an attack technique."] }], safeGuardrails: "This is a demo app. Focus on safe design review only.", solutionOutline: "Remove broad admin-like power from student role and enforce proper authorization.", rubric: { evidenceIdentification: 20, riskReasoning: 20, safeNextStep: 20, clarity: 20, safetyBoundary: 20 } },
  { id: uid("lab"), slug: "password-policy-audit", title: "Password Policy Audit", category: "Policy audit", difficulty: "Beginner", description: "Review a fictional school password policy and recommend safer, usable improvements.", scenarioBriefing: "A learning center wants a student-safe account policy before launch.", fictionalDatasetLabel: "Fictional policy excerpt", evidenceChecklist: ["weak minimum length", "missing MFA for staff", "unclear reset process"], artifactSuggestion: { type: "password-policy-audit", title: "Password policy audit memo", prompt: "Write a concise audit with evidence, risk, and prioritized defensive recommendations." }, dataset: { policy: ["Minimum password length: 6", "MFA: optional for staff", "Password reset: handled by any club mentor", "Password manager: allowed"] }, tasks: [{ id: "task1", prompt: "Which policy items create the most risk?", expectedKeywords: ["length", "mfa", "reset"] }, { id: "task2", prompt: "Recommend two safer changes that are realistic for students.", expectedKeywords: ["longer", "mfa", "verified", "manager"] }], safeGuardrails: "Fictional policy only. Do not request, collect, or test real passwords.", solutionOutline: "Increase length, require MFA for privileged staff, and make reset approvals explicit.", rubric: { evidenceIdentification: 20, riskReasoning: 20, safeNextStep: 20, clarity: 20, safetyBoundary: 20 } },
  { id: uid("lab"), slug: "risk-register-review", title: "Risk Register Review", category: "GRC/risk", difficulty: "Intermediate", description: "Prioritize fictional risks for a school cyber club pilot.", scenarioBriefing: "A principal asks which launch risks should be handled before onboarding students.", fictionalDatasetLabel: "Toy risk register", evidenceChecklist: ["impact", "likelihood", "owner", "treatment"], artifactSuggestion: { type: "risk-register", title: "School pilot risk register", prompt: "Create a short risk register with owners and treatment actions." }, dataset: { risks: [{ item: "No parent-facing safety summary", likelihood: "medium", impact: "high" }, { item: "Mentor dashboard export not reviewed", likelihood: "low", impact: "medium" }, { item: "Unsafe external links in club notes", likelihood: "medium", impact: "high" }] }, tasks: [{ id: "task1", prompt: "Which two risks should be prioritized and why?", expectedKeywords: ["safety", "external links", "impact"] }, { id: "task2", prompt: "Assign a safe treatment action for one risk.", expectedKeywords: ["owner", "mitigate", "review", "policy"] }], safeGuardrails: "This is governance practice with fictional risks, not legal advice or real incident handling.", solutionOutline: "Prioritize student safety communication and external-link review, then assign owners and mitigations.", rubric: { evidenceIdentification: 20, riskReasoning: 20, safeNextStep: 20, clarity: 20, safetyBoundary: 20 } },
  { id: uid("lab"), slug: "network-log-review-basic", title: "Basic Network Log Review", category: "Log analysis", difficulty: "Beginner", description: "Review fictional network flow summaries and write a cautious defensive note.", scenarioBriefing: "A club laptop shows repeated outbound connections in a fictional training log.", fictionalDatasetLabel: "Toy flow log", evidenceChecklist: ["repeated destination", "unusual port label", "benign explanation", "defensive next step"], artifactSuggestion: { type: "incident-report", title: "Network log review note", prompt: "Document what stands out, what you cannot conclude yet, and the safest next step." }, dataset: { flows: [{ host: "club-laptop-02", destination: "203.0.113.45", service: "unknown-training-service", count: 18 }, { host: "club-laptop-02", destination: "198.51.100.20", service: "https", count: 5 }] }, tasks: [{ id: "task1", prompt: "What stands out without overclaiming?", expectedKeywords: ["repeated", "unknown", "review"] }, { id: "task2", prompt: "What should a defender do next?", expectedKeywords: ["validate", "ask", "document", "monitor"] }], safeGuardrails: "Fictional metadata only. Do not scan, probe, or contact any real address.", solutionOutline: "Flag the repeated unknown service, preserve the log, ask for expected-app context, and monitor or escalate if unexplained.", rubric: { evidenceIdentification: 20, riskReasoning: 20, safeNextStep: 20, clarity: 20, safetyBoundary: 20 } },
  { id: uid("lab"), slug: "ai-security-awareness-scenario", title: "AI Security Awareness Scenario", category: "AI security awareness", difficulty: "Beginner", description: "Classify safe and unsafe uses of an AI assistant in a school cyber club.", scenarioBriefing: "A teacher wants guidelines for AI use during beginner cyber labs.", fictionalDatasetLabel: "Toy classroom scenarios", evidenceChecklist: ["private data boundary", "allowed learning help", "human review", "school policy"], artifactSuggestion: { type: "executive-summary", title: "AI safety classroom summary", prompt: "Write a parent/teacher-friendly summary of safe AI use boundaries." }, dataset: { scenarios: ["Student asks AI to explain a glossary term", "Student pastes a real classmate email into AI", "Mentor asks AI to draft a generic incident-report template", "Student asks for steps against a real website"] }, tasks: [{ id: "task1", prompt: "Which scenarios are acceptable and which are not?", expectedKeywords: ["glossary", "template", "private", "real website"] }, { id: "task2", prompt: "Write one classroom rule that keeps AI use safe.", expectedKeywords: ["fictional", "no private data", "authorized", "defensive"] }], safeGuardrails: "Defensive awareness only. No real personal data, real-target instructions, or bypass guidance.", solutionOutline: "Allow explanation and generic templates; prohibit private data sharing and real-target requests.", rubric: { evidenceIdentification: 20, riskReasoning: 20, safeNextStep: 20, clarity: 20, safetyBoundary: 20 } }
];

const capstones: Capstone[] = [
  { id: uid("cap"), title: "SOC Alert Triage Portfolio", specialization: "SOC analyst", summary: "Build a mini report pack that classifies fictional alerts, explains severity, and proposes next steps.", deliverables: ["triage worksheet", "evidence notes", "final incident summary"], difficulty: "Intermediate" },
  { id: uid("cap"), title: "Secure Web Review Journal", specialization: "AppSec analyst", summary: "Review a toy web app for broken access control, misconfiguration, and weak session handling.", deliverables: ["risk table", "remediation notes", "before-after explanation"], difficulty: "Advanced" },
  { id: uid("cap"), title: "Cloud IAM Hardening Blueprint", specialization: "cloud security", summary: "Shrink excessive permissions in a mock cloud environment and justify each change.", deliverables: ["role inventory", "least-privilege redesign", "executive summary"], difficulty: "Advanced" },
  { id: uid("cap"), title: "Incident Response Evidence Pack", specialization: "incident responder", summary: "Use fictional logs and host notes to produce a timeline and containment recommendation.", deliverables: ["timeline", "scope statement", "containment proposal"], difficulty: "Intermediate" },
  { id: uid("cap"), title: "Risk and Privacy Mini Assessment", specialization: "GRC analyst", summary: "Assess a fictional service for key risks, privacy concerns, and continuity requirements.", deliverables: ["risk register", "privacy observations", "continuity controls"], difficulty: "Intermediate" }
];
const tracks: Track[] = [
  {
    id: 'track-foundations', slug: 'cyber-foundations', title: 'Cyber Foundations', level: 'Beginner', trackType: 'career', estimatedHours: 18,
    description: 'A safe beginner route through security vocabulary, risk, identity, phishing, and device hygiene.', frameworkRef: 'NICE: Cyber Defense Foundations',
    hero: 'Start here if you need structure, confidence, and defensive habits before specialization.', targetRoles: ['Student', 'Cyber club member', 'Junior analyst candidate'],
    skills: ['Security vocabulary', 'Risk thinking', 'Identity basics', 'Phishing defense'], milestones: ['Finish core lessons', 'Pass foundation quizzes', 'Publish first artifact'],
    outcomes: ['Explain core cybersecurity concepts in plain language', 'Recognize common personal and school security risks', 'Create a first defensive learning artifact'],
    entryPoints: ['What Is Cybersecurity?', 'The CIA Triad'], prerequisites: ['Curiosity and basic computer use'], recommendedFor: ['school', 'curiosity', 'cyber club']
  },
  {
    id: 'track-soc', slug: 'soc-analyst', title: 'SOC Analyst Starter', level: 'Beginner to Intermediate', trackType: 'career', estimatedHours: 26,
    description: 'Practice alert triage, log reading, incident notes, and clear escalation decisions.', frameworkRef: 'NICE: Cyber Defense Analyst',
    hero: 'Build a practical blue-team foundation without touching real targets.', targetRoles: ['SOC analyst intern', 'Blue-team student'],
    skills: ['Log analysis', 'Alert triage', 'Incident communication', 'SIEM concepts'], milestones: ['Triage a phishing case', 'Write an incident summary', 'Clear review queue'],
    outcomes: ['Separate alert evidence from assumptions', 'Write a concise incident escalation note', 'Use safe SOC vocabulary in fictional triage cases'],
    entryPoints: ['Logging, SIEM, EDR, and Incident Response'], prerequisites: ['Cyber Foundations recommended'], recommendedFor: ['job', 'university', 'cyber club']
  },
  {
    id: 'track-appsec', slug: 'appsec', title: 'Application Security Basics', level: 'Intermediate', trackType: 'career', estimatedHours: 24,
    description: 'Learn how web apps fail safely using toy examples, access-control reviews, and secure coding notes.', frameworkRef: 'OWASP Top 10 learning alignment',
    hero: 'Turn web security into careful review, not exploit chasing.', targetRoles: ['AppSec learner', 'Secure coding student'],
    skills: ['HTTP basics', 'Session thinking', 'Access control', 'Secure remediation'], milestones: ['Review a toy role matrix', 'Write a secure-code note', 'Explain risk to a non-engineer'],
    outcomes: ['Map a simple web request and session flow', 'Identify access-control risk in toy scenarios', 'Recommend safe developer-facing remediation'],
    entryPoints: ['How Web Apps Work'], prerequisites: ['Browser and web basics'], recommendedFor: ['university', 'job']
  },
  {
    id: 'track-cloud', slug: 'cloud-security', title: 'Cloud & IAM Defense', level: 'Intermediate', trackType: 'skill', estimatedHours: 20,
    description: 'Practice least privilege, secrets hygiene, and cloud misconfiguration review in fictional datasets.', frameworkRef: 'CSA / NICE cloud security concepts',
    hero: 'Understand cloud security as defensive configuration and evidence-based review.', targetRoles: ['Cloud learner', 'Security engineer candidate'],
    skills: ['IAM review', 'Least privilege', 'Secrets handling', 'Misconfiguration triage'], milestones: ['Complete IAM lab', 'Produce an access-review artifact'],
    outcomes: ['Explain least privilege and blast radius', 'Spot secrets and IAM issues in fictional datasets', 'Draft a safe cloud access-review memo'],
    entryPoints: ['Cloud Basics, IAM, Secrets, and Containers'], prerequisites: ['IAM basics'], recommendedFor: ['job', 'university']
  },
  {
    id: 'track-grc', slug: 'grc', title: 'GRC & Risk Foundations', level: 'Beginner', trackType: 'skill', estimatedHours: 16,
    description: 'Learn risk registers, privacy basics, continuity, and business communication for school cohorts.', frameworkRef: 'NIST CSF / risk management basics',
    hero: 'Make cybersecurity understandable to decision-makers.', targetRoles: ['GRC learner', 'School cohort student'],
    skills: ['Risk assessment', 'Control mapping', 'Executive summaries', 'Continuity thinking'], milestones: ['Write a risk register', 'Explain control tradeoffs'],
    outcomes: ['Build a clear beginner risk register', 'Explain privacy and continuity trade-offs', 'Write school-safe executive summaries without jargon'],
    entryPoints: ['Risk, Privacy, Business Continuity, and Disaster Recovery'], prerequisites: ['Cyber Foundations recommended'], recommendedFor: ['school', 'university']
  },
  {
    id: 'track-ai-awareness', slug: 'ai-security-awareness', title: 'AI Security Awareness', level: 'Beginner', trackType: 'skill', estimatedHours: 10,
    description: 'Understand safe AI use, data handling, prompt boundaries, and defensive review habits.', frameworkRef: 'AI safety and secure-use awareness',
    hero: 'Use AI tools carefully without leaking data or automating unsafe behavior.', targetRoles: ['Students using AI tools', 'Teachers'],
    skills: ['Data minimization', 'Prompt safety', 'Model limitation awareness', 'Policy communication'], milestones: ['Write safe AI-use guidance', 'Spot unsafe data sharing'],
    outcomes: ['Recognize unsafe AI data sharing', 'Write a simple classroom AI-use rule', 'Keep AI assistance inside authorized defensive learning'],
    entryPoints: ['Ethics, Law, and Safe Learning Rules'], prerequisites: ['None'], recommendedFor: ['school', 'curiosity']
  }
];


const trackLessonSlugs: Record<string, string[]> = {
  'cyber-foundations': ['what-is-cybersecurity', 'cia-triad', 'risk-assets-threats', 'identity-access-basics', 'passwords-mfa-and-phishing', 'device-hygiene'],
  'soc-analyst': ['logging-siem-edr-ir', 'passwords-mfa-and-phishing', 'networking-fundamentals', 'operating-systems-and-files', 'python-bash-and-apis', 'capstones-and-interview-prep'],
  appsec: ['browser-and-web-basics', 'how-web-apps-work', 'sessions-cookies-and-auth-flows', 'owasp-style-risks', 'reporting-and-ethics'],
  'cloud-security': ['identity-access-basics', 'iam-encryption-and-keys', 'cloud-iam-and-containers', 'least-privilege-and-defense-in-depth', 'risk-privacy-bcdr'],
  grc: ['risk-assets-threats', 'identity-access-basics', 'risk-privacy-bcdr', 'reporting-and-ethics', 'capstones-and-interview-prep'],
  'ai-security-awareness': ['reporting-and-ethics', 'specialization-tracks', 'risk-privacy-bcdr', 'capstones-and-interview-prep']
};

function getEnrichedTracks(lessons: Lesson[]): Track[] {
  const bySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  return tracks.map((track) => {
    const mappedLessons = (trackLessonSlugs[track.slug] || [])
      .map((slug, index) => ({ lesson: bySlug.get(slug), index }))
      .filter((item): item is { lesson: Lesson; index: number } => Boolean(item.lesson));
    const lessonLinks = mappedLessons.map(({ lesson, index }) => ({
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      competency: track.skills[Math.min(index, Math.max(0, track.skills.length - 1))] || 'Defensive learning',
      weight: Math.max(1, 5 - index)
    }));
    const recommended = mappedLessons[0]?.lesson;
    return {
      ...track,
      lessonCount: lessonLinks.length,
      competencies: lessonLinks,
      lessonLinks,
      recommendedLessonId: recommended?.id,
      recommendedLessonSlug: recommended?.slug,
      recommendedLessonTitle: recommended?.title
    };
  });
}

const guidedProjects: GuidedProject[] = [
  { id: 'project-incident-report', slug: 'incident-report-pack', title: 'Fictional Incident Report Pack', specialization: 'SOC analyst', difficulty: 'Beginner', summary: 'Turn a toy alert into a timeline, severity call, and safe escalation note.', estimatedHours: 3, checkpoints: ['Classify alert', 'Build timeline', 'Write executive summary'], rubric: ['Evidence quality', 'Safe containment logic', 'Clear communication'], starterLessonSlug: 'logging-siem-edr-ir' },
  { id: 'project-phishing-triage', slug: 'phishing-triage-brief', title: 'Phishing Triage Brief', specialization: 'Awareness / SOC', difficulty: 'Beginner', summary: 'Analyze a fake email and produce a user-safe reporting recommendation.', estimatedHours: 2, checkpoints: ['Identify indicators', 'Assess user impact', 'Recommend safe action'], rubric: ['Indicator precision', 'User-safe language', 'No unsafe interaction'], starterLessonSlug: 'passwords-mfa-and-phishing' },
  { id: 'project-access-review', slug: 'access-review-memo', title: 'Access Review Memo', specialization: 'Cloud security', difficulty: 'Intermediate', summary: 'Review a toy role matrix and justify least-privilege changes.', estimatedHours: 3, checkpoints: ['Find excessive access', 'Map risk', 'Write remediation plan'], rubric: ['Least-privilege reasoning', 'Business impact', 'Specific remediation'], starterLessonSlug: 'identity-access-basics' },
  { id: 'project-risk-register', slug: 'school-risk-register', title: 'School Cyber Risk Register', specialization: 'GRC', difficulty: 'Beginner', summary: 'Create a simple risk register for a fictional school club system.', estimatedHours: 3, checkpoints: ['List assets', 'Rate risks', 'Choose controls'], rubric: ['Risk clarity', 'Control fit', 'Readable summary'], starterLessonSlug: 'risk-assets-threats' }
];

const plans: Plan[] = [
  { id: 'free', name: 'Free', accessLevel: 50, priceMonthlyUsd: 0, priceMonthlyUzs: 0, description: 'Starter lessons, selected labs, and public demo access.', features: ['Beginner foundations', 'Selected safe labs', 'Mistake notebook preview'] },
  { id: 'premium', name: 'Premium', accessLevel: 100, priceMonthlyUsd: 3, priceMonthlyUzs: 36000, trialDays: 30, description: 'Full student learning path with guided projects and certificates.', features: ['All lessons and labs', 'Guided portfolio projects', 'Certificate eligibility checks', 'Expanded AI tutor'], paymentMethods: ['Future hosted card checkout', 'Future Payme integration'] },
  { id: 'school', name: 'School / Cohort', accessLevel: 100, description: 'Mentor dashboards, assignment tracking, cohort reporting, and school-safe rollout support.', features: ['Cohort progress dashboard', 'Weak-area reports', 'Mentor alerts', 'Exportable student summaries'], paymentMethods: ['Invoice / pilot agreement'] }
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

  const portfolio: PortfolioArtifact[] = [
    { id: uid("artifact"), userId: studentId, title: "Phishing triage brief", artifactType: "incident_report", specialization: "SOC analyst", summary: "A concise report explaining indicators, likely user impact, and a safe reporting path for a fictional phishing message.", deliverables: ["indicator table", "user-safe response", "mentor-ready summary"], status: "published", evidenceUrl: null, mentorFeedback: "Good proof of defensive reasoning. Add one sentence on business impact next time.", scenario: "Fictional payroll phishing email", evidenceUsed: ["sender mismatch", "urgent payroll language"], riskExplanation: "Credential capture risk if a learner follows the fake link.", defensiveRecommendations: "Report through approved channel, do not click, preserve headers if policy allows.", reflection: "I learned to separate suspicious signals from assumptions.", publicShareId: "demo-phishing-brief", publishedAt: daysAgo(2), createdAt: daysAgo(5), updatedAt: daysAgo(2) }
  ];

  const certificates: Certificate[] = [
    { id: uid("cert"), userId: studentId, trackSlug: "cyber-foundations", title: "Cyber Foundations Demo Certificate", status: "issued", issuedAt: daysAgo(1), criteria: { score: 82, completionRate: 33, quizAverage: 78, portfolioCount: 1, labsPassed: 2, assessedSkills: ["risk", "identity", "phishing defense"] } }
  ];

  const mentorAssignments: MentorAssignment[] = [
    { id: uid("assign"), mentorId, studentId, lessonId: lessons[9]?.id ?? null, trackSlug: "soc-analyst", title: "Tighten SOC vocabulary", instructions: "Review the logging lesson and write three precise definitions: event, alert, incident.", targetMastery: 75, dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: "open", rubric: ["precise terms", "safe escalation", "clear examples"], createdAt: daysAgo(1), updatedAt: daysAgo(1) }
  ];

  const learnerProjects: LearnerProject[] = [
    { id: uid("learner_project"), userId: studentId, guidedProjectId: guidedProjects[0].id, status: "in_progress", checkpointProgress: ["Classify alert"], reflection: "I need to support severity with evidence.", evidenceUrl: null, createdAt: daysAgo(3), updatedAt: daysAgo(1), project: guidedProjects[0] }
  ];

  const cohorts: Cohort[] = [
    { id: uid("cohort"), slug: "demo-school-blue-team", name: "Demo School Blue Team Cohort", description: "A simulated school cohort for mentor and admin dashboards.", cadence: "weekly", startDate: daysAgo(14), endDate: null, mentorId, memberCount: 2, members: [
      { id: studentId, name: "Amina Student", email: "student@cyberpath.local", membershipRole: "learner" },
      { id: student2Id, name: "Leo Learner", email: "student2@cyberpath.local", membershipRole: "learner" }
    ] }
  ];

  const mentorAlerts: MentorAlert[] = [
    { id: uid("alert"), studentId, mentorId, cohortId: cohorts[0].id, alertType: "weak_area", category: "retention", severity: "medium", summary: "Amina has repeated misses in foundations vocabulary.", recommendation: "Assign a short review and ask for a one-paragraph explanation in plain language.", status: "open", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    { id: uid("alert"), studentId: student2Id, mentorId, cohortId: cohorts[0].id, alertType: "momentum", category: "engagement", severity: "low", summary: "Leo has not published a portfolio artifact yet.", recommendation: "Nudge the access-control review project and give a concrete artifact template.", status: "reviewing", createdAt: daysAgo(2), updatedAt: daysAgo(2) }
  ];

  const feedback: FeedbackItem[] = [
    { id: uid("support"), userId: studentId, name: "Amina Student", email: "student@cyberpath.local", category: "feature", message: "I would like a clearer checklist after each lab.", status: "new", createdAt: daysAgo(1), updatedAt: daysAgo(1) }
  ];

  const waitlist: WaitlistSubmission[] = [
    { id: uid("waitlist"), name: "Demo School Director", email: "director@example.edu", role: "school owner", organization: "Tashkent Learning Center", countryCity: "Uzbekistan / Tashkent", studentCount: 80, interestLevel: "school pilot", message: "Interested in a safe cyber club pilot with mentor reports.", createdAt: daysAgo(1) }
  ];
  const pilotLeads: PilotLead[] = [
    { id: uid("pilot"), contactName: "Demo School Director", email: "director@example.edu", phoneOrTelegram: "@demo_school", role: "school_leader", organizationName: "Tashkent Learning Center", cityCountry: "Tashkent, Uzbekistan", studentCount: 80, studentAgeRange: "14-18", currentCyberLevel: "Cyber club exists but lacks safe structured labs", needsMost: "Mentor dashboard, defensive labs, CSV reports, and parent-safe positioning.", interestLevel: "ready_for_pilot", wouldPay: "maybe", message: "Interested in a safe cyber club pilot with mentor reports.", status: "new", notes: "Demo lead seeded for admin review.", createdAt: daysAgo(1), updatedAt: daysAgo(1) }
  ];

  const analyticsEvents: AnalyticsEvent[] = [
    { id: uid("event"), eventName: "demo_start", role: "student", createdAt: daysAgo(2) },
    { id: uid("event"), eventName: "demo_role_selected", role: "mentor", createdAt: daysAgo(1) },
    { id: uid("event"), eventName: "waitlist_view", createdAt: daysAgo(1) }
  ];

  const subscriptions: Subscription[] = [
    { id: uid("sub"), userId: studentId, planId: "free", status: "active", billingCycle: "monthly", currentPeriodEnd: null, providerCustomerId: null, providerSubscriptionId: null, createdAt: daysAgo(10), updatedAt: daysAgo(10) }
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
    skillMastery: seedSkillMastery(studentId, student2Id),
    skillExerciseAttempts: [],
    portfolio,
    certificates,
    guidedProjects,
    learnerProjects,
    mentorAssignments,
    mentorAlerts,
    cohorts,
    feedback,
    waitlist,
    pilotLeads,
    analyticsEvents,
    subscriptions,
    sessionUserId: studentId
  };
}

function isValidDemoDb(value: Partial<DemoDb> | null): value is DemoDb {
  return Boolean(
    value &&
    Array.isArray(value.users) &&
    Array.isArray(value.lessons) &&
    Array.isArray(value.quizQuestions) &&
    Array.isArray(value.labs) &&
    Array.isArray(value.capstones) &&
    Array.isArray(value.progress) &&
    Array.isArray(value.attempts) &&
    Array.isArray(value.mistakes) &&
    Array.isArray(value.mentorFeedback) &&
    Array.isArray(value.mentorLinks) &&
    Array.isArray(value.labSubmissions) &&
    Array.isArray((value as any).skillMastery) &&
    Array.isArray((value as any).skillExerciseAttempts) &&
    Array.isArray(value.portfolio) &&
    Array.isArray(value.certificates) &&
    Array.isArray(value.guidedProjects) &&
    Array.isArray(value.learnerProjects) &&
    Array.isArray(value.mentorAssignments) &&
    Array.isArray(value.mentorAlerts) &&
    Array.isArray(value.cohorts) &&
    Array.isArray(value.feedback) &&
    Array.isArray(value.waitlist) &&
    Array.isArray((value as any).pilotLeads) &&
    Array.isArray(value.analyticsEvents) &&
    Array.isArray(value.subscriptions)
  );
}

export function resetMockDemoData(preserveSession = true): DemoDb {
  const previousUserEmail = preserveSession ? getSessionUserSafe()?.email : null;
  [DB_KEY, ...LEGACY_DB_KEYS].forEach((key) => localStorage.removeItem(key));
  const seeded = seedDb();
  if (previousUserEmail) {
    const restored = seeded.users.find((user) => user.email === previousUserEmail);
    if (restored) seeded.sessionUserId = restored.id;
  }
  writeDb(seeded);
  return seeded;
}

function getSessionUserSafe(): DemoUser | null {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    const db = JSON.parse(raw) as Partial<DemoDb>;
    if (!db.sessionUserId || !Array.isArray(db.users)) return null;
    return (db.users as DemoUser[]).find((user) => user.id === db.sessionUserId) || null;
  } catch {
    return null;
  }
}

function readDb(): DemoDb {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return resetMockDemoData(false);

  try {
    const parsed = JSON.parse(raw) as Partial<DemoDb>;
    if (isValidDemoDb(parsed)) {
      parsed.users = parsed.users.map((user) => normalizeDemoUser(user));
      const firstStudentId = parsed.users.find((user) => user.role === 'student')?.id;
      if (firstStudentId) {
        parsed.portfolio = parsed.portfolio.map((artifact) => ({ ...artifact, userId: artifact.userId ?? firstStudentId }));
        parsed.certificates = parsed.certificates.map((certificate) => ({ ...certificate, userId: certificate.userId ?? firstStudentId }));
      }
      writeDb(parsed);
      return parsed;
    }
  } catch {
    // Corrupt localStorage should never break the public demo.
  }

  return resetMockDemoData(true);
}

function writeDb(db: DemoDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getSessionUser(db: DemoDb): DemoUser | null {
  if (!db.sessionUserId) return null;
  return db.users.find((user) => user.id === db.sessionUserId) || null;
}

function normalizeDemoUser(user: DemoUser): DemoUser {
  const timestamp = now();
  return {
    ...user,
    name: user.name || "New learner",
    email: String(user.email || "").toLowerCase(),
    role: user.role || "student",
    goal: user.goal ?? null,
    experienceLevel: user.experienceLevel ?? null,
    placementScore: user.placementScore ?? null,
    roadmapJson: user.roadmapJson ?? null,
    streakDays: user.streakDays ?? 0,
    createdAt: user.createdAt ?? timestamp,
    updatedAt: user.updatedAt ?? user.createdAt ?? timestamp
  };
}

function sanitizeUser(user: DemoUser): User {
  const safeUser = normalizeDemoUser(user);
  return {
    id: safeUser.id,
    name: safeUser.name,
    email: safeUser.email,
    role: safeUser.role,
    goal: safeUser.goal,
    experienceLevel: safeUser.experienceLevel,
    placementScore: safeUser.placementScore,
    roadmapJson: safeUser.roadmapJson,
    streakDays: safeUser.streakDays,
    createdAt: safeUser.createdAt,
    updatedAt: safeUser.updatedAt
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

function getLessonWithProgress(db: DemoDb, userId: string, lesson: Lesson): Lesson {
  const progress = db.progress.find((entry) => entry.userId === userId && entry.lessonId === lesson.id);
  return { ...lesson, completed: progress?.completed || false, timeSpentMinutes: progress?.timeSpentMinutes || 0 };
}

function getMastery(db: DemoDb, userId: string) {
  const analytics = computeAnalytics(db, userId);
  const completedSlugs = new Set(db.progress.filter((entry) => entry.userId === userId && entry.completed).map((entry) => db.lessons.find((lesson) => lesson.id === entry.lessonId)?.slug).filter(Boolean));
  const attempts = db.attempts.filter((entry) => entry.userId === userId);
  const quizAverage = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length) : 0;
  const reviews = getDueReviews(db, userId);

  return tracks.map((track, index) => {
    const relatedLessons = db.lessons.filter((lesson) => {
      const text = `${lesson.title} ${lesson.phaseTitle} ${lesson.specialization ?? ''}`.toLowerCase();
      return track.skills.some((skill) => text.includes(skill.toLowerCase().split(' ')[0])) || text.includes(track.slug.split('-')[0]);
    });
    const relevantCount = relatedLessons.length || Math.max(4, Math.ceil(db.lessons.length / tracks.length));
    const completed = relatedLessons.filter((lesson) => completedSlugs.has(lesson.slug)).length || (index === 0 ? analytics.totalCompleted : Math.max(0, analytics.totalCompleted - index * 2));
    const completionRate = Math.min(100, Math.round((completed / relevantCount) * 100));
    const score = Math.min(100, Math.round(completionRate * 0.5 + quizAverage * 0.35 + Math.max(analytics.streakDays, 1) * 3));
    const band = score >= 85 ? 'mastered' : score >= 70 ? 'proficient' : score >= 45 ? 'familiar' : 'attempted';
    const dueForTrack = reviews.filter((review) => track.skills.some((skill) => review.topic.toLowerCase().includes(skill.toLowerCase().split(' ')[0]))).length;

    return {
      trackSlug: track.slug,
      title: track.title,
      frameworkRef: track.frameworkRef,
      trackType: track.trackType,
      estimatedHours: track.estimatedHours,
      hero: track.hero,
      score,
      quizAverage,
      completionRate,
      status: score >= 70 ? 'Ready' : score >= 45 ? 'Developing' : 'Foundational',
      band,
      evidence: db.portfolio.filter((artifact) => artifact.userId === userId && String(artifact.specialization || '').toLowerCase().includes(track.slug.split('-')[0])).map((artifact) => artifact.title),
      nextMilestone: track.milestones[0] ?? 'Complete the next lesson and create evidence.',
      milestones: track.milestones,
      skills: track.skills,
      reviewDueCount: dueForTrack,
      reviewHealth: Math.max(0, 100 - dueForTrack * 15),
      confidence: Math.min(100, score + 5),
      evidenceCount: db.portfolio.filter((artifact) => artifact.userId === userId).length,
      lessonCount: relatedLessons.length,
      entryPoints: track.entryPoints,
      prerequisites: track.prerequisites,
      recommendedFor: track.recommendedFor
    };
  });
}


function scoreToState(score: number, lastPracticedAt?: string | null, cadenceDays = 14): MasteryState {
  if (lastPracticedAt && Date.now() - new Date(lastPracticedAt).getTime() > cadenceDays * 24 * 60 * 60 * 1000) return 'needs_review';
  if (score >= 80) return 'mastered';
  if (score >= 60) return 'proficient';
  if (score >= 40) return 'practiced';
  if (score >= 20) return 'introduced';
  return 'not_started';
}

function baseRecord(userId: string, skillId: string, score = 0, lastPracticedAt: string | null = null): SkillMasteryRecord & { userId?: string } {
  const skill = skillCatalog.find((item) => item.id === skillId);
  const state = scoreToState(score, lastPracticedAt, skill?.reviewCadenceDays ?? 14);
  return {
    userId,
    skillId,
    score,
    state,
    confidence: Math.max(0, Math.min(100, score - (state === 'needs_review' ? 20 : 0))),
    lessonCompletion: score ? Math.min(100, score + 8) : 0,
    quizAccuracy: score ? Math.max(0, score - 4) : 0,
    exercisePerformance: score ? score : 0,
    labScore: score >= 50 ? Math.max(0, score - 10) : 0,
    reviewSuccessStreak: score >= 80 ? 3 : score >= 60 ? 2 : score >= 35 ? 1 : 0,
    portfolioQuality: score >= 70 ? 70 : 0,
    lastPracticedAt,
    nextReviewAt: lastPracticedAt ? new Date(new Date(lastPracticedAt).getTime() + (skill?.reviewCadenceDays ?? 14) * 24 * 60 * 60 * 1000).toISOString() : null,
    history: score ? [{ at: lastPracticedAt ?? now(), score, state, reason: 'Seeded demo mastery signal' }] : []
  };
}

function seedSkillMastery(studentId: string, student2Id: string): SkillMasteryRecord[] {
  return [
    baseRecord(studentId, 'cyber-what-is-cybersecurity', 86, daysAgo(1)),
    baseRecord(studentId, 'cyber-cia-triad', 74, daysAgo(2)),
    baseRecord(studentId, 'cyber-risk-basics', 52, daysAgo(16)),
    baseRecord(studentId, 'cyber-ethics-authorization', 80, daysAgo(20)),
    baseRecord(studentId, 'iam-authentication', 45, daysAgo(4)),
    baseRecord(studentId, 'iam-authorization', 38, daysAgo(5)),
    baseRecord(studentId, 'net-ip-dns-http', 42, daysAgo(3)),
    baseRecord(studentId, 'net-logs-flows', 30, daysAgo(1)),
    baseRecord(studentId, 'soc-alert-triage', 25, daysAgo(2)),
    baseRecord(student2Id, 'cyber-what-is-cybersecurity', 72, daysAgo(3)),
    baseRecord(student2Id, 'cyber-cia-triad', 64, daysAgo(12)),
    baseRecord(student2Id, 'cyber-risk-basics', 41, daysAgo(4)),
    baseRecord(student2Id, 'iam-authentication', 58, daysAgo(6)),
    baseRecord(student2Id, 'iam-authorization', 28, daysAgo(19)),
    baseRecord(student2Id, 'linux-files-permissions', 48, daysAgo(5))
  ].map(({ userId, ...record }) => ({ ...(record as SkillMasteryRecord), userId } as any));
}

function getUserSkillRecord(db: DemoDb, userId: string, skillId: string): SkillMasteryRecord {
  const existing = (db.skillMastery as any[]).find((item) => item.userId === userId && item.skillId === skillId) as (SkillMasteryRecord & { userId?: string }) | undefined;
  const skill = skillCatalog.find((item) => item.id === skillId);
  if (!existing) return baseRecord(userId, skillId, 0, null);
  const decayedState = scoreToState(existing.score, existing.lastPracticedAt, skill?.reviewCadenceDays ?? 14);
  return { ...existing, state: decayedState, confidence: Math.max(0, Math.min(100, existing.score - (decayedState === 'needs_review' ? 20 : 0))) };
}

function upsertSkillRecord(db: DemoDb, userId: string, record: SkillMasteryRecord) {
  const records = db.skillMastery as any[];
  const index = records.findIndex((item) => item.userId === userId && item.skillId === record.skillId);
  const stored = { ...record, userId };
  if (index >= 0) records[index] = stored;
  else records.push(stored);
}

function buildSkillTree(db: DemoDb, userId: string) {
  const nodes = skillCatalog.map((skill) => {
    const mastery = getUserSkillRecord(db, userId, skill.id);
    const lockedPrereq = skill.prerequisites.find((prereq) => {
      const prereqRecord = getUserSkillRecord(db, userId, prereq);
      return !['practiced', 'proficient', 'mastered'].includes(prereqRecord.state);
    });
    const lessons = skill.lessonSlugs.map((slug) => {
      const lesson = db.lessons.find((item) => item.slug === slug);
      if (!lesson) return null;
      const progress = db.progress.find((entry) => entry.userId === userId && entry.lessonId === lesson.id);
      return { id: lesson.id, slug: lesson.slug, title: lesson.title, completed: progress?.completed || false };
    }).filter(Boolean);
    const labs = skill.labSlugs.map((slug) => {
      const lab = db.labs.find((item) => item.slug === slug);
      return lab ? { id: lab.id, slug: lab.slug, title: lab.title } : null;
    }).filter(Boolean);
    const exercises = exerciseCatalog.filter((exercise) => skill.exerciseIds.includes(exercise.id));
    return {
      ...skill,
      mastery,
      locked: Boolean(lockedPrereq),
      lockedReason: lockedPrereq ? `Practice prerequisite: ${skillCatalog.find((item) => item.id === lockedPrereq)?.title ?? lockedPrereq}` : null,
      recommended: false,
      lessons,
      exercises,
      labs
    };
  }).filter((node) => node.lessons.length || node.exercises.length);
  const recommended = nodes.find((node) => !node.locked && !['mastered', 'needs_review'].includes(node.mastery.state)) ?? nodes.find((node) => node.mastery.state === 'needs_review') ?? nodes[0];
  nodes.forEach((node) => { node.recommended = node.id === recommended?.id; });
  return skillCategories.map((category) => ({ ...category, nodes: nodes.filter((node) => node.categoryId === category.id) })).filter((category) => category.nodes.length);
}

function getMasterySummary(db: DemoDb, userId: string) {
  const categories = buildSkillTree(db, userId);
  const nodes = categories.flatMap((category) => category.nodes);
  const ranked = nodes.slice().sort((a, b) => a.mastery.score - b.mastery.score);
  const pathGroups = new Map<string, { completed: number; total: number }>();
  nodes.forEach((node) => {
    const key = node.trackSlug || 'cyber-foundations';
    const value = pathGroups.get(key) || { completed: 0, total: 0 };
    value.total += 1;
    if (['proficient', 'mastered'].includes(node.mastery.state)) value.completed += 1;
    pathGroups.set(key, value);
  });
  return {
    records: nodes.map((node) => node.mastery),
    weakestSkills: ranked.filter((node) => node.mastery.state !== 'not_started').slice(0, 5),
    strongestSkills: ranked.slice().reverse().filter((node) => node.mastery.score > 0).slice(0, 5),
    needsReview: nodes.filter((node) => node.mastery.state === 'needs_review'),
    recommendedNextSkill: nodes.find((node) => node.recommended) ?? null,
    pathProgress: Array.from(pathGroups.entries()).map(([trackSlug, value]) => ({ trackSlug, ...value, percent: value.total ? Math.round((value.completed / value.total) * 100) : 0 }))
  };
}

function applySkillDelta(db: DemoDb, userId: string, skillId: string, delta: number, reason: string) {
  const current = getUserSkillRecord(db, userId, skillId);
  const nextScore = Math.max(0, Math.min(100, current.score + delta));
  const skill = skillCatalog.find((item) => item.id === skillId);
  const state = scoreToState(nextScore, now(), skill?.reviewCadenceDays ?? 14);
  const record: SkillMasteryRecord = {
    ...current,
    score: nextScore,
    state,
    confidence: nextScore,
    exercisePerformance: Math.max(0, Math.min(100, current.exercisePerformance + delta)),
    reviewSuccessStreak: delta > 0 ? current.reviewSuccessStreak + 1 : 0,
    lastPracticedAt: now(),
    nextReviewAt: new Date(Date.now() + (skill?.reviewCadenceDays ?? 14) * 24 * 60 * 60 * 1000).toISOString(),
    history: [...(current.history ?? []), { at: now(), score: nextScore, state, reason }].slice(-12)
  };
  upsertSkillRecord(db, userId, record);
  return record;
}

function getRecommendations(db: DemoDb, userId: string): Recommendation[] {
  const mastery = getMastery(db, userId);
  const weakest = mastery.slice().sort((a, b) => a.score - b.score)[0];
  const due = getDueReviews(db, userId)[0];
  const nextLesson = getContinueLesson(db, userId);
  return [
    due ? { id: 'rec-review', title: `Clear ${due.topic} review debt`, reason: 'Spaced review prevents beginner concepts from decaying after the demo session.', actionType: 'quiz', actionTarget: '/practice', priority: 'high' } : null,
    nextLesson ? { id: 'rec-lesson', title: `Finish ${nextLesson.title}`, reason: 'Completing the next lesson unlocks better recommendations and keeps the public demo flow obvious.', actionType: 'lesson', actionTarget: nextLesson.slug, priority: 'medium' } : null,
    weakest ? { id: 'rec-mastery', title: `Raise ${weakest.title} mastery`, reason: `This track is currently at ${weakest.score}% and is the best place to improve your readiness signal.`, actionType: 'lesson', actionTarget: weakest.trackSlug, priority: weakest.score < 50 ? 'high' : 'medium' } : null,
    { id: 'rec-portfolio', title: 'Turn the next lab into proof of work', reason: 'A portfolio artifact makes the learning credible for mentors, parents, and school pilots.', actionType: 'portfolio', actionTarget: '/portfolio', priority: 'low' }
  ].filter(Boolean) as Recommendation[];
}

function getDueReviews(db: DemoDb, userId: string): ReviewItem[] {
  return db.mistakes.filter((item) => item.userId === userId).slice(0, 5).map((mistake, index) => ({
    id: `review-${mistake.id}`,
    userId,
    sourceType: 'mistake',
    sourceId: mistake.id,
    topic: mistake.topic,
    subtopic: mistake.subtopic,
    prompt: mistake.prompt,
    dueAt: daysAgo(0),
    lastReviewedAt: mistake.lastSeenAt,
    intervalDays: index + 1,
    easeFactor: 2.2,
    successStreak: Math.max(0, 3 - mistake.repeatCount),
    status: 'due',
    createdAt: mistake.createdAt,
    updatedAt: mistake.lastSeenAt
  }));
}

function getContinueLesson(db: DemoDb, userId: string) {
  const sorted = db.lessons.slice().sort((a, b) => a.phase - b.phase || a.orderIndex - b.orderIndex);
  const lesson = sorted.find((item) => !db.progress.some((entry) => entry.userId === userId && entry.lessonId === item.id && entry.completed)) ?? sorted[0] ?? null;
  if (!lesson) return null;
  return { id: lesson.id, slug: lesson.slug, title: lesson.title, phaseTitle: lesson.phaseTitle, estimatedMinutes: lesson.estimatedMinutes };
}

function getPracticeHub(db: DemoDb, userId: string) {
  const user = db.users.find((item) => item.id === userId);
  const analytics = computeAnalytics(db, userId);
  const dueReviews = getDueReviews(db, userId);
  const mastery = getMastery(db, userId);
  const assignments = db.mentorAssignments.filter((item) => item.studentId === userId && item.status !== 'done');
  const activeProject = db.learnerProjects.find((item) => item.userId === userId && item.status !== 'done') ?? null;
  const continueLesson = getContinueLesson(db, userId);
  const weakest = mastery.slice().sort((a, b) => a.score - b.score)[0] ?? null;
  const goalTrack = tracks.find((track) => track.recommendedFor?.includes(String(user?.goal || '').toLowerCase())) ?? tracks.find((track) => track.slug.includes(String(user?.goal || '').toLowerCase())) ?? tracks[0];
  const questSteps = [
    { id: 'review', label: dueReviews.length ? `Clear ${Math.min(2, dueReviews.length)} due review item(s)` : 'Run one review set', href: '/practice', done: dueReviews.length === 0 },
    { id: 'lesson', label: continueLesson ? `Complete ${continueLesson.title}` : 'Choose one lesson', href: continueLesson ? `/lessons/${continueLesson.slug}` : '/paths', done: false },
    { id: 'artifact', label: activeProject ? `Advance ${activeProject.project.title}` : 'Start one proof-of-work artifact', href: '/portfolio', done: db.portfolio.some((artifact) => artifact.userId === userId && artifact.status === 'published') }
  ];

  return {
    streak: { days: analytics.streakDays, nextMilestone: analytics.streakDays < 7 ? 7 : 14, daysRemaining: Math.max(0, (analytics.streakDays < 7 ? 7 : 14) - analytics.streakDays) },
    continueLesson,
    recoveryPlan: analytics.streakDays < 2 ? { title: 'Streak recovery', summary: 'Recover with one review rep, one focused lesson checkpoint, and one small proof-of-work action today.', actions: ['Clear one due review item', 'Spend 15 minutes on the next lesson', 'Update one portfolio note'] } : { title: `Goal-aligned next step: ${goalTrack.title}`, summary: 'Your demo profile has a goal. The dashboard is steering you toward the safest first track for that goal.', actions: ['Finish the highlighted lesson', 'Complete one safe lab', 'Add one artifact note'] },
    dailyQuest: { title: "Today's high-value plan", rewardLabel: weakest ? `Raise ${weakest.title}` : 'Build momentum', progress: questSteps.filter((step) => step.done).length, total: questSteps.length, steps: questSteps },
    focusAreas: [
      dueReviews[0] ? { id: 'due-review', title: `${dueReviews[0].topic} review is due`, description: dueReviews[0].prompt, badge: 'Due now', href: '/practice', actionLabel: 'Clear review' } : null,
      assignments[0] ? { id: 'assignment', title: assignments[0].title, description: assignments[0].instructions, badge: 'Mentor assigned', href: '/dashboard', actionLabel: 'Open assignment' } : null,
      weakest ? { id: 'mastery', title: `${weakest.title} mastery challenge`, description: `Current score: ${weakest.score}%. Complete one lesson and one quiz retry to move this lane.`, badge: weakest.trackType === 'skill' ? 'Skill path' : 'Career path', href: '/paths', actionLabel: 'Open path' } : null,
      { id: 'portfolio', title: 'Portfolio proof suggestion', description: 'After your next lab, create an incident report, access review, risk register, secure coding review, or executive summary.', badge: 'Proof of work', href: '/portfolio', actionLabel: 'Create artifact' }
    ].filter(Boolean),
    reviewQueue: dueReviews.map((item) => ({ id: item.id, title: `${item.topic} review`, description: item.prompt, badge: item.status === 'due' ? 'Due' : `${item.intervalDays}d`, href: '/practice', actionLabel: 'Review now' })),
    assignments: assignments.slice(0, 4),
    activeProject,
    paths: mastery.slice(0, 5).map((item) => ({ trackSlug: item.trackSlug, title: item.title, trackType: item.trackType ?? 'career', estimatedHours: item.estimatedHours ?? 0, hero: item.hero ?? item.nextMilestone, score: item.score, completionRate: item.completionRate, quizAverage: item.quizAverage, band: item.band, reviewDueCount: item.reviewDueCount }))
  };
}

function getSubscriptionForUser(db: DemoDb, userId: string) {
  let subscription = db.subscriptions.find((item) => item.userId === userId);
  if (!subscription) {
    subscription = { id: uid('sub'), userId, planId: 'free', status: 'active', billingCycle: 'monthly', currentPeriodEnd: null, providerCustomerId: null, providerSubscriptionId: null, createdAt: now(), updatedAt: now() };
    db.subscriptions.push(subscription);
    writeDb(db);
  }
  return subscription;
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
      .map((lesson) => getLessonWithProgress(db, authUser.id, lesson));
    const mentorFeedback = db.mentorFeedback
      .filter((item) => item.studentId === authUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3)
      .map((item) => ({ id: item.id, message: item.message, createdAt: item.createdAt }));
    return {
      analytics,
      roadmap: authUser.roadmapJson || buildRoadmap(authUser.goal || 'school', authUser.experienceLevel || 'beginner', authUser.placementScore || 0),
      nextLessons,
      mentorFeedback,
      capstones: db.capstones,
      mastery: getMastery(db, authUser.id),
      masterySummary: getMasterySummary(db, authUser.id),
      recommendations: getRecommendations(db, authUser.id),
      certificates: db.certificates.filter((item) => item.userId === authUser.id && item.trackSlug && item.id && item.title),
      portfolio: db.portfolio.filter((item) => item.userId === authUser.id && item.id && item.title),
      cohort: db.cohorts.find((cohort) => cohort.members?.some((member) => member.id === authUser.id)) ?? null,
      assignments: db.mentorAssignments.filter((item) => item.studentId === authUser.id),
      dueReviews: getDueReviews(db, authUser.id),
      guidedProjects: db.guidedProjects,
      learnerProjects: db.learnerProjects.filter((item) => item.userId === authUser.id),
      tracks: getEnrichedTracks(db.lessons),
      practiceHub: getPracticeHub(db, authUser.id)
    } as T;
  }

  if (path === "/learning/practice-hub") {
    const authUser = requireUser(db);
    return { practiceHub: getPracticeHub(db, authUser.id) } as T;
  }

  if (path === "/learning/paths") {
    const phases = Array.from(new Set(db.lessons.map((lesson) => lesson.phase))).map((phase) => ({
      phase,
      title: db.lessons.find((lesson) => lesson.phase === phase)?.phaseTitle || `Phase ${phase}`,
      lessons: db.lessons.filter((lesson) => lesson.phase === phase).sort((a, b) => a.orderIndex - b.orderIndex)
    }));
    return { phases, capstones: db.capstones, glossary: db.glossary.slice(0, 30).map((item, index) => ({ id: `glossary-${index}`, ...item })), labs: db.labs, tracks: getEnrichedTracks(db.lessons), guidedProjects: db.guidedProjects } as T;
  }

  if (path === "/learning/skills") {
    const authUser = requireUser(db);
    return { skills: skillCatalog, categories: skillCategories, mastery: getMasterySummary(db, authUser.id).records } as T;
  }

  if (path === "/learning/skill-tree") {
    const authUser = requireUser(db);
    const categories = buildSkillTree(db, authUser.id);
    return { categories, recommendedNextSkill: getMasterySummary(db, authUser.id).recommendedNextSkill } as T;
  }

  if (path.startsWith("/learning/practice/session")) {
    const authUser = requireUser(db);
    const query = path.includes("?") ? new URLSearchParams(path.split("?")[1]) : new URLSearchParams();
    const mode = (query.get("mode") as PracticeMode) || "practice";
    const requestedSkillId = query.get("skillId");
    const summary = getMasterySummary(db, authUser.id);
    const skillNode = requestedSkillId
      ? buildSkillTree(db, authUser.id).flatMap((category) => category.nodes).find((node) => node.id === requestedSkillId)
      : summary.recommendedNextSkill;
    if (!skillNode) throw new Error("No available skill for practice.");
    const exercises = exerciseCatalog.filter((exercise) => exercise.skillId === skillNode.id && (mode === "practice" || exercise.mode === mode || exercise.mode === "practice")).slice(0, 4);
    return { session: { id: uid("practice_session"), mode, skillId: skillNode.id, skillTitle: skillNode.title, exercises: exercises.length ? exercises : skillNode.exercises, masteryBefore: skillNode.mastery } } as T;
  }

  if (path === "/learning/review") {
    const authUser = requireUser(db);
    const summary = getMasterySummary(db, authUser.id);
    const reviewSkills = summary.needsReview.length ? summary.needsReview : summary.weakestSkills.slice(0, 3);
    return { review: reviewSkills.map((skill) => ({ skill, exercises: exerciseCatalog.filter((exercise) => exercise.skillId === skill.id).slice(0, 2) })) } as T;
  }

  if (path === "/learning/mastery") {
    const authUser = requireUser(db);
    return { mastery: getMasterySummary(db, authUser.id) } as T;
  }

  if (path === "/learning/mistakes") {
    const authUser = requireUser(db);
    return { mistakes: db.mistakes.filter((item) => item.userId === authUser.id).sort((a, b) => b.repeatCount - a.repeatCount) } as T;
  }

  if (path === "/learning/mistakes/review-quiz") {
    const authUser = requireUser(db);
    const mistakes = db.mistakes.filter((item) => item.userId === authUser.id).slice(0, 10);
    return { quiz: mistakes.map((mistake, index) => ({ id: `review-${index}`, type: "short-response", topic: mistake.topic, prompt: `Review prompt: ${mistake.prompt}`, explanation: mistake.explanation, correctAnswer: mistake.correctAnswer })), recommendations: getRecommendations(db, authUser.id) } as T;
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

  if (path === "/learning/analytics") {
    const authUser = requireUser(db);
    return { analytics: computeAnalytics(db, authUser.id) } as T;
  }

  if (path === "/learning/glossary") {
    return { glossary: db.glossary.map((item, index) => ({ id: `glossary-${index}`, ...item })) } as T;
  }

  if (path === "/learning/capstones") {
    return { capstones: db.capstones } as T;
  }

  if (path === "/learning/portfolio") {
    const authUser = requireUser(db);
    return { portfolio: db.portfolio.filter((item) => item.userId === authUser.id && item.id && item.title) } as T;
  }

  if (path === "/learning/projects") {
    const authUser = requireUser(db);
    return { guidedProjects: db.guidedProjects, learnerProjects: db.learnerProjects.filter((item) => item.userId === authUser.id) } as T;
  }

  if (path === "/learning/assignments") {
    const authUser = requireUser(db);
    return { assignments: db.mentorAssignments.filter((item) => item.studentId === authUser.id) } as T;
  }

  if (path === "/platform/plans") {
    return { plans, billingIntegration: { supportEmail: "madijonovsardorbek544@gmail.com", providers: ["Future hosted card checkout", "Future Payme integration"], securityNotice: "The public demo never collects card numbers. Production billing must use processor-hosted, tokenized checkout and verified webhooks." } } as T;
  }

  if (path === "/platform/subscription") {
    const authUser = requireUser(db);
    const subscription = getSubscriptionForUser(db, authUser.id);
    return { plans, subscription, plan: plans.find((item) => item.id === subscription.planId) ?? plans[0], demoBillingEnabled: true } as T;
  }

  if (path === "/platform/my-feedback") {
    const authUser = requireUser(db);
    return { feedback: db.feedback.filter((item) => item.userId === authUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) } as T;
  }

  if (path.startsWith("/platform/portfolio/public/")) {
    const shareId = path.split("/").pop()!;
    const artifact = db.portfolio.find((item) => item.publicShareId === shareId);
    if (!artifact) throw new Error("Public artifact not found.");
    const owner = db.users.find((item) => item.role === "student");
    return { artifact: { ...artifact, ownerName: owner?.name } } as T;
  }

  if (path === "/mentor/students") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const links = authUser.role === "admin" ? db.users.filter((item) => item.role === "student").map((item) => ({ studentId: item.id })) : db.mentorLinks.filter((link) => link.mentorId === authUser.id);
    const students = links.map((link) => {
      const student = db.users.find((item) => item.id === link.studentId)!;
      return { ...sanitizeUser(student), analytics: computeAnalytics(db, student.id), mastery: getMastery(db, student.id), portfolioCount: db.portfolio.filter((artifact) => artifact.userId === student.id).length, assignmentCount: db.mentorAssignments.filter((item) => item.studentId === student.id && item.status !== "done").length, cohort: db.cohorts.find((cohort) => cohort.members?.some((member) => member.id === student.id)) ?? null };
    });
    return { students } as T;
  }

  if (path === "/mentor/cohort-dashboard") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const links = authUser.role === "admin" ? db.users.filter((item) => item.role === "student").map((item) => ({ studentId: item.id })) : db.mentorLinks.filter((link) => link.mentorId === authUser.id);
    const students = links.map((link) => {
      const student = db.users.find((item) => item.id === link.studentId)!;
      const analytics = computeAnalytics(db, student.id);
      const labsCompleted = db.labSubmissions.filter((item) => item.userId === student.id).length;
      const portfolioArtifacts = db.portfolio.filter((artifact) => artifact.userId === student.id).length;
      const lastActiveAt = [...db.labSubmissions.filter((item) => item.userId === student.id).map((item) => item.createdAt), ...db.progress.filter((item) => item.userId === student.id && item.completedAt).map((item) => item.completedAt!)].sort().pop() ?? daysAgo(12);
      const riskStatus = Date.now() - new Date(lastActiveAt).getTime() > 10 * 24 * 60 * 60 * 1000 ? "inactive" : analytics.totalQuizAccuracy < 60 ? "struggling" : analytics.totalQuizAccuracy < 75 || analytics.completionRate < 25 ? "needs attention" : "on track";
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        goalPath: student.goal ?? "Cyber Foundations",
        lessonsCompleted: db.progress.filter((item) => item.userId === student.id && item.completed).length,
        quizAccuracy: analytics.totalQuizAccuracy,
        labsCompleted,
        portfolioArtifacts,
        lastActiveAt,
        riskStatus,
        recommendedNextAction: riskStatus === "on track" ? "Create proof-of-work artifact from next lab." : "Assign targeted review sprint and check in this week."
      };
    });
    const masteryNodes = (studentId: string) => buildSkillTree(db, studentId).flatMap((category) => category.nodes).slice(0, 8);
    const masteryHeatmap = students.map((student) => ({ studentId: student.id, studentName: student.name, skills: masteryNodes(student.id).map((node) => ({ skillId: node.id, title: node.title, category: node.categoryTitle, score: node.mastery.score, state: node.mastery.state })) }));
    const studentsReadyForLab = students.filter((student) => masteryNodes(student.id).some((node) => ["proficient", "mastered"].includes(node.mastery.state) && node.labs.length));
    const studentsNeedingReview = students.filter((student) => masteryNodes(student.id).some((node) => node.mastery.state === "needs_review"));
    const weakCounts = new Map<string, number>();
    students.forEach((student) => computeAnalytics(db, student.id).weakTopics.forEach((topic) => weakCounts.set(topic.topic, (weakCounts.get(topic.topic) ?? 0) + 1)));
    const weakTopicHeatmap = Array.from(weakCounts.entries()).map(([topic, affectedStudents]) => ({ topic, affectedStudents, intensity: Math.round((affectedStudents / Math.max(1, students.length)) * 100) }));
    const labSubmissions = db.labSubmissions.map((submission) => ({
      ...submission,
      studentName: db.users.find((item) => item.id === submission.userId)?.name ?? "Demo learner",
      labTitle: db.labs.find((item) => item.id === submission.labId)?.title ?? "Demo lab",
      labSlug: db.labs.find((item) => item.id === submission.labId)?.slug ?? "demo-lab",
      rubricResult: { categoryScores: { evidence: 18, risk: 16, defensiveNextStep: 20, clarity: 12, safetyAuthorization: 15 } }
    }));
    const artifactReviews = db.portfolio.map((artifact) => ({ ...artifact, studentName: db.users.find((item) => item.role === "student")?.name ?? "Demo learner" }));
    return {
      metrics: {
        totalStudents: students.length,
        activeThisWeek: students.filter((student) => Date.now() - new Date(student.lastActiveAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length,
        inactiveStudents: students.filter((student) => student.riskStatus === "inactive").length,
        lessonsCompleted: students.reduce((sum, student) => sum + student.lessonsCompleted, 0),
        quizAverage: students.length ? Math.round(students.reduce((sum, student) => sum + student.quizAccuracy, 0) / students.length) : 0,
        labsSubmitted: labSubmissions.length,
        portfolioArtifactsCreated: db.portfolio.length,
        weakTopics: weakTopicHeatmap.map((item) => item.topic).slice(0, 5),
        assignmentsDue: db.mentorAssignments.filter((item) => item.status !== "done").length,
        studentsNeedingHelp: students.filter((student) => student.riskStatus !== "on track").length
      },
      students,
      masteryHeatmap,
      studentsReadyForLab,
      studentsNeedingReview,
      weakTopicHeatmap,
      inactiveAlerts: students.filter((student) => student.riskStatus === "inactive"),
      labSubmissions,
      artifactReviews
    } as T;
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

  if (path === "/mentor/alerts") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const alerts = db.mentorAlerts
      .filter((item) => authUser.role === "admin" || item.mentorId === authUser.id)
      .map((item) => ({ ...item, student: db.users.find((userItem) => userItem.id === item.studentId) ? { name: db.users.find((userItem) => userItem.id === item.studentId)!.name, email: db.users.find((userItem) => userItem.id === item.studentId)!.email } : null }));
    return { alerts } as T;
  }

  if (path === "/mentor/cohorts") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    return { cohorts: db.cohorts.filter((item) => authUser.role === "admin" || item.mentorId === authUser.id) } as T;
  }

  if (path === "/mentor/assignments") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const assignments = db.mentorAssignments
      .filter((item) => authUser.role === "admin" || item.mentorId === authUser.id)
      .map((item) => ({ ...item, student: db.users.find((userItem) => userItem.id === item.studentId) ? { name: db.users.find((userItem) => userItem.id === item.studentId)!.name, email: db.users.find((userItem) => userItem.id === item.studentId)!.email } : null }));
    return { assignments } as T;
  }

  if (path === "/admin/pilot-leads" || path.startsWith("/platform/pilot-leads")) {
    const authUser = requireUser(db);
    ensureRole(authUser, ["admin"]);
    return { pilotLeads: db.pilotLeads } as T;
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
        openPlatformFeedback: db.feedback.filter((item) => item.status !== "resolved").length,
        waitlistSubmissions: db.waitlist.length,
        pilotLeads: db.pilotLeads.length,
        readyPilotLeads: db.pilotLeads.filter((item) => item.interestLevel === "ready_for_pilot").length,
        schoolPilotInterest: db.pilotLeads.filter((item) => /ready|interested/i.test(item.interestLevel)).length,
        demoStarts: db.analyticsEvents.filter((item) => item.eventName === "demo_start" || item.eventName === "demo_role_selected").length,
        artifactsCreated: db.portfolio.length,
        queuedEmails: 1,
        completionRate
      },
      users: db.users.map(sanitizeUser),
      lessons: db.lessons,
      labs: db.labs,
      platformFeedback: db.feedback,
      waitlist: db.waitlist,
      pilotLeads: db.pilotLeads,
      validationMetrics: {
        usefulnessScore: db.feedback.length ? Math.round(db.feedback.reduce((sum, item) => sum + (item.usefulnessScore ?? 4), 0) / db.feedback.length) : 0,
        willingnessToPay: { yes: db.feedback.filter((item) => item.willingnessToPay === "yes").length, maybe: db.feedback.filter((item) => item.willingnessToPay === "maybe").length, no: db.feedback.filter((item) => item.willingnessToPay === "no").length },
        confusionThemes: ["lab checklist clarity", "IAM terminology", "portfolio quality expectations"],
        mostRequestedTopics: ["SOC Level 1", "Cloud IAM", "Uzbek glossary", "School reports"],
        demoConversionSignals: { landingToDemo: 42, demoToWaitlist: 12, schoolPilotRequests: db.pilotLeads.length }
      },
      emailOutbox: [
        { id: "email-demo-welcome", toEmail: "student@cyberpath.local", subject: "Welcome to CyberPath Academy", messageType: "welcome", status: "queued", createdAt: daysAgo(1) }
      ],
      auditLogs: [
        { id: "audit-demo-seed", action: "demo.seeded", targetType: "mock_db", targetId: DB_KEY, createdAt: daysAgo(1) },
        { id: "audit-demo-feedback", action: "platform.feedback_received", targetType: "feedback", targetId: db.feedback[0]?.id ?? null, createdAt: db.feedback[0]?.createdAt ?? now() }
      ]
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
    const timestamp = now();
    if (db.users.some((item) => item.email.toLowerCase() === data.email.toLowerCase())) throw new Error("An account with that email already exists.");
    const user: DemoUser = normalizeDemoUser({
      id: uid("user"),
      name: data.name?.trim() || "New learner",
      email: data.email.toLowerCase(),
      password: data.password,
      role: "student",
      goal: null,
      experienceLevel: null,
      placementScore: null,
      roadmapJson: null,
      streakDays: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    });
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
    const data = body as { goal?: string; experienceLevel?: string; score?: number };
    const goal = data.goal || "awareness";
    const experienceLevel = data.experienceLevel || "beginner";
    const score = Number.isFinite(data.score) ? Math.max(0, Math.min(100, Math.round(Number(data.score)))) : 0;
    authUser.goal = goal;
    authUser.experienceLevel = experienceLevel;
    authUser.placementScore = score;
    authUser.roadmapJson = buildRoadmap(goal, experienceLevel, score);
    authUser.streakDays = authUser.streakDays ?? 0;
    authUser.updatedAt = now();
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
      const matched = (task.expectedKeywords ?? task.expectedEvidence ?? []).some((keyword) => answer.includes(keyword.toLowerCase()));
      if (matched) score += Math.round(100 / lab.tasks.length);
      return `${task.prompt}: ${matched ? "good defensive judgment" : "needs stronger evidence and safer reasoning"}`;
    }).join(" | ");
    const submission: LabSubmission = { id: uid("labsub"), userId: authUser.id, labId: lab.id, answers: data.answers, score: Math.min(100, score), feedback, createdAt: now() };
    db.labSubmissions.push(submission);
    writeDb(db);
    return { submission } as T;
  }

  if (path === "/learning/practice/submit" || path === "/learning/review/submit") {
    const authUser = requireUser(db);
    const data = body as { sessionId?: string; exerciseId: string; answer: unknown; mode?: PracticeMode };
    const exercise = exerciseCatalog.find((item) => item.id === data.exerciseId);
    if (!exercise) throw new Error("Exercise not found.");
    const isCorrect = isExerciseCorrect(exercise, data.answer);
    const mode = data.mode || (path.includes("review") ? "review" : "practice");
    const scoreDelta = isCorrect ? (mode === "mastery_challenge" ? 12 : mode === "review" ? 8 : 6) : (mode === "mastery_challenge" ? -5 : -2);
    const updatedMastery = applySkillDelta(db, authUser.id, exercise.skillId, scoreDelta, `${mode} ${isCorrect ? "success" : "miss"}`);
    db.skillExerciseAttempts.push({ id: uid("skill_attempt"), userId: authUser.id, skillId: exercise.skillId, exerciseId: exercise.id, mode, isCorrect, scoreDelta, createdAt: now() });
    if (!isCorrect) {
      db.mistakes.push({ id: uid("mistake"), userId: authUser.id, questionId: exercise.id, topic: skillCatalog.find((item) => item.id === exercise.skillId)?.title ?? exercise.skillId, subtopic: exercise.type, prompt: exercise.prompt, explanation: exercise.explanation, userAnswer: data.answer, correctAnswer: exercise.correctAnswer ?? exercise.rubric, repeatCount: 1, createdAt: now(), lastSeenAt: now(), notes: "Created by adaptive practice engine." });
    }
    writeDb(db);
    return { feedback: { isCorrect, scoreDelta, updatedMastery, explanation: exercise.explanation, wrongAnswerReason: isCorrect ? undefined : exercise.commonWrongAnswerExplanation, missedConcept: isCorrect ? undefined : skillCatalog.find((item) => item.id === exercise.skillId)?.title, reviewRecommendation: isCorrect ? "Keep going or try the mastery challenge." : "Review the related lesson, then retry a similar safe scenario.", retryExercise: isCorrect ? undefined : exerciseCatalog.find((item) => item.skillId === exercise.skillId && item.id !== exercise.id), relatedLessonSlug: exercise.relatedLessonSlug } } as T;
  }

  if (path === "/learning/certificates/claim") {
    const authUser = requireUser(db);
    const existing = db.certificates.filter((item) => item.userId === authUser.id && item.id && item.trackSlug);
    if (!existing.length) {
      const analytics = computeAnalytics(db, authUser.id);
      db.certificates.push({ id: uid("cert"), userId: authUser.id, trackSlug: "cyber-foundations", title: "Cyber Foundations Demo Certificate", status: "issued", issuedAt: now(), criteria: { score: 80, completionRate: analytics.completionRate, quizAverage: analytics.totalQuizAccuracy, portfolioCount: db.portfolio.filter((artifact) => artifact.userId === authUser.id).length, labsPassed: db.labSubmissions.filter((submission) => submission.userId === authUser.id).length } });
      writeDb(db);
    }
    return { certificates: db.certificates.filter((item) => item.userId === authUser.id && item.id) } as T;
  }

  if (path === "/learning/portfolio") {
    const authUser = requireUser(db);
    const data = body as Partial<PortfolioArtifact>;
    const artifact: PortfolioArtifact = {
      id: uid("artifact"),
      userId: authUser.id,
      title: data.title || "Demo portfolio artifact",
      artifactType: data.artifactType || "incident_report",
      specialization: data.specialization || "SOC analyst",
      summary: data.summary || "A defensive proof-of-work artifact created in the public demo.",
      deliverables: data.deliverables?.length ? data.deliverables : ["summary", "evidence", "recommendations"],
      status: data.status || "draft",
      evidenceUrl: data.evidenceUrl ?? null,
      mentorFeedback: data.mentorFeedback ?? null,
      scenario: data.scenario,
      evidenceUsed: data.evidenceUsed ?? [],
      riskExplanation: data.riskExplanation,
      defensiveRecommendations: data.defensiveRecommendations,
      reflection: data.reflection,
      publicShareId: data.status === "published" ? uid("share") : null,
      publishedAt: data.status === "published" ? now() : null,
      createdAt: now(),
      updatedAt: now()
    };
    db.portfolio.unshift(artifact);
    writeDb(db);
    return { artifact, portfolio: db.portfolio.filter((item) => item.userId === authUser.id && item.id) } as T;
  }

  if (path === "/learning/projects") {
    const authUser = requireUser(db);
    const data = body as { guidedProjectId?: string; projectId?: string };
    const guidedProjectId = data.guidedProjectId || data.projectId || db.guidedProjects[0]?.id;
    const project = db.guidedProjects.find((item) => item.id === guidedProjectId) ?? db.guidedProjects[0];
    if (!project) throw new Error("No guided project available.");
    let learnerProject = db.learnerProjects.find((item) => item.userId === authUser.id && item.guidedProjectId === project.id);
    if (!learnerProject) {
      learnerProject = { id: uid("learner_project"), userId: authUser.id, guidedProjectId: project.id, status: "in_progress", checkpointProgress: [], reflection: null, evidenceUrl: null, createdAt: now(), updatedAt: now(), project };
      db.learnerProjects.push(learnerProject);
    } else {
      learnerProject.status = learnerProject.status === "not_started" ? "in_progress" : learnerProject.status;
      learnerProject.updatedAt = now();
    }
    writeDb(db);
    return { learnerProjects: db.learnerProjects.filter((item) => item.userId === authUser.id) } as T;
  }

  if (path === "/platform/subscription/demo-checkout") {
    const authUser = requireUser(db);
    const data = body as { planId?: string };
    const selected = plans.find((item) => item.id === data.planId) ?? plans[0];
    let subscription = getSubscriptionForUser(db, authUser.id);
    subscription.planId = selected.id;
    subscription.status = "active";
    subscription.billingCycle = "monthly";
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    subscription.updatedAt = now();
    writeDb(db);
    return { message: `Demo checkout activated ${selected.name}. No payment information was collected.`, subscription } as T;
  }



  if (path === "/platform/pilot-leads") {
    const data = body as Partial<PilotLead>;
    if (!data.email || !String(data.email).includes("@")) throw new Error("Invalid school pilot lead.");
    const item: PilotLead = {
      id: uid("pilot"),
      contactName: data.contactName || "Demo pilot lead",
      email: data.email,
      phoneOrTelegram: data.phoneOrTelegram || null,
      role: data.role || "teacher",
      organizationName: data.organizationName || "Demo School",
      cityCountry: data.cityCountry || "Demo City",
      studentCount: typeof data.studentCount === "number" ? data.studentCount : null,
      studentAgeRange: data.studentAgeRange || null,
      currentCyberLevel: data.currentCyberLevel || "Beginner",
      needsMost: data.needsMost || "Safe school-ready cybersecurity pilot",
      interestLevel: data.interestLevel || "interested",
      wouldPay: data.wouldPay || "maybe",
      message: data.message || null,
      status: "new",
      notes: null,
      createdAt: now(),
      updatedAt: now()
    };
    db.pilotLeads.unshift(item);
    db.analyticsEvents.unshift({ id: uid("event"), eventName: "school_pilot_form_submit", role: item.role, createdAt: now() });
    writeDb(db);
    return { message: "School pilot request saved in this demo browser.", pilotLead: item } as T;
  }

  if (path === "/platform/waitlist") {
    const data = body as Partial<WaitlistSubmission>;
    const item: WaitlistSubmission = {
      id: uid("waitlist"),
      name: data.name || "Demo pilot lead",
      email: data.email || "pilot@example.edu",
      role: data.role || "teacher",
      organization: data.organization || null,
      countryCity: data.countryCity || null,
      studentCount: typeof data.studentCount === "number" ? data.studentCount : null,
      interestLevel: data.interestLevel || "school pilot",
      message: data.message || null,
      createdAt: now()
    };
    db.waitlist.unshift(item);
    db.feedback.unshift({ id: uid("feedback"), userId: null, name: item.name, email: item.email, category: "waitlist", message: `${item.role} from ${item.organization || "unknown organization"} requested ${item.interestLevel}: ${item.message || "No message"}`, status: "new", usefulnessScore: 5, willingnessToPay: /school|pilot/i.test(item.interestLevel) ? "maybe" : "no", audienceRole: item.role, goal: item.interestLevel, createdAt: now(), updatedAt: now() });
    writeDb(db);
    return { message: "Thanks — your public beta / school pilot interest was saved in this demo browser.", waitlist: item } as T;
  }

  if (path === "/platform/analytics/event") {
    const data = body as { eventName?: string; role?: string };
    db.analyticsEvents.unshift({ id: uid("event"), eventName: data.eventName || "demo_event", role: data.role, createdAt: now() });
    writeDb(db);
    return { ok: true } as T;
  }

  if (path === "/platform/feedback" || path === "/platform/my-feedback") {
    const maybeUser = getSessionUser(db);
    const data = body as Partial<FeedbackItem>;
    const item: FeedbackItem = {
      id: uid("feedback"),
      userId: path === "/platform/my-feedback" ? maybeUser?.id ?? null : maybeUser?.id ?? null,
      name: data.name || maybeUser?.name || "Public demo visitor",
      email: data.email || maybeUser?.email || "demo@example.com",
      category: data.category || "support",
      message: data.message || "Demo feedback",
      status: "new",
      usefulnessScore: data.usefulnessScore ?? null,
      difficulty: data.difficulty ?? null,
      willingnessToPay: data.willingnessToPay ?? null,
      audienceRole: data.audienceRole ?? null,
      goal: data.goal ?? null,
      createdAt: now(),
      updatedAt: now()
    };
    db.feedback.unshift(item);
    writeDb(db);
    return { message: "Thanks — demo feedback was saved locally.", feedback: item } as T;
  }

  if (path === "/mentor/assignments") {
    const authUser = requireUser(db);
    ensureRole(authUser, ["mentor", "admin"]);
    const data = body as Partial<MentorAssignment>;
    if (!data.studentId) throw new Error("Choose a student before creating an assignment.");
    const assignment: MentorAssignment = { id: uid("assign"), mentorId: authUser.id, studentId: data.studentId, lessonId: data.lessonId ?? null, trackSlug: data.trackSlug ?? null, title: data.title || "Demo mentor assignment", instructions: data.instructions || "Complete the assigned review and explain your evidence.", targetMastery: data.targetMastery ?? null, dueAt: data.dueAt ?? null, status: "open", rubric: data.rubric ?? [], createdAt: now(), updatedAt: now() };
    db.mentorAssignments.unshift(assignment);
    writeDb(db);
    return { assignment } as T;
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

  if (path.startsWith("/learning/portfolio/")) {
    const id = path.split("/").pop()!;
    const artifact = db.portfolio.find((item) => item.id === id);
    if (!artifact) throw new Error("Portfolio artifact not found.");
    Object.assign(artifact, body as Partial<PortfolioArtifact>, { updatedAt: now() });
    if ((body as Partial<PortfolioArtifact>).status === "published" && !artifact.publicShareId) {
      artifact.publicShareId = uid("share");
      artifact.publishedAt = now();
    }
    writeDb(db);
    return { artifact, portfolio: db.portfolio.filter((item) => item.userId === authUser.id && item.id) } as T;
  }

  if (path.startsWith("/platform/pilot-leads/")) {
    const authUser = requireUser(db);
    ensureRole(authUser, ["admin"]);
    const id = path.split("/").at(-1)!;
    const item = db.pilotLeads.find((entry) => entry.id === id);
    if (!item) throw new Error("Pilot lead not found.");
    const data = body as Partial<PilotLead>;
    item.status = data.status || item.status;
    item.notes = data.notes === undefined ? item.notes : data.notes || null;
    item.updatedAt = now();
    writeDb(db);
    return { pilotLead: item } as T;
  }

  if (path.startsWith("/platform/feedback/") && path.endsWith("/status")) {
    ensureRole(authUser, ["admin"]);
    const id = path.split("/")[3];
    const item = db.feedback.find((entry) => entry.id === id);
    if (!item) throw new Error("Feedback item not found.");
    item.status = (body as { status: string }).status;
    item.updatedAt = now();
    writeDb(db);
    return { feedback: item } as T;
  }

  if (path.startsWith("/mentor/alerts/")) {
    ensureRole(authUser, ["mentor", "admin"]);
    const id = path.split("/").pop()!;
    const item = db.mentorAlerts.find((entry) => entry.id === id);
    if (!item) throw new Error("Alert not found.");
    item.status = (body as { status: MentorAlert["status"] }).status;
    item.updatedAt = now();
    writeDb(db);
    return { alert: item } as T;
  }

  if (path.startsWith("/mentor/assignments/")) {
    ensureRole(authUser, ["mentor", "admin"]);
    const id = path.split("/").pop()!;
    const item = db.mentorAssignments.find((entry) => entry.id === id);
    if (!item) throw new Error("Assignment not found.");
    Object.assign(item, body as Partial<MentorAssignment>, { updatedAt: now() });
    writeDb(db);
    return { assignment: item } as T;
  }

  if (path.startsWith("/learning/assignments/")) {
    const id = path.split("/").pop()!;
    const item = db.mentorAssignments.find((entry) => entry.id === id && entry.studentId === authUser.id);
    if (!item) throw new Error("Assignment not found.");
    item.status = (body as { status: string }).status;
    item.updatedAt = now();
    writeDb(db);
    return { assignment: item } as T;
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
