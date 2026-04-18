import bcrypt from 'bcryptjs';
import { buildRoadmap } from '../src/utils/roadmap.js';
import { db, initDb, makeId, nowIso, run, toDbJson } from '../src/lib/db.js';

type LessonBlueprint = {
  slug: string;
  title: string;
  phase: number;
  phaseTitle: string;
  level: string;
  orderIndex: number;
  specialization: string;
  concepts: string[];
};

const lessonBlueprints: LessonBlueprint[] = [
  { slug: 'what-is-cybersecurity', title: 'What Is Cybersecurity?', phase: 1, phaseTitle: 'Foundations', level: 'Beginner', orderIndex: 1, specialization: 'awareness', concepts: ['cybersecurity scope', 'people, process, technology', 'defensive mindset', 'authorized learning'] },
  { slug: 'cia-triad', title: 'The CIA Triad', phase: 1, phaseTitle: 'Foundations', level: 'Beginner', orderIndex: 2, specialization: 'awareness', concepts: ['confidentiality', 'integrity', 'availability', 'trade-offs'] },
  { slug: 'risk-assets-threats', title: 'Assets, Threats, Vulnerabilities, and Risk', phase: 1, phaseTitle: 'Foundations', level: 'Beginner', orderIndex: 3, specialization: 'awareness', concepts: ['assets', 'threats', 'vulnerabilities', 'risk treatment'] },
  { slug: 'identity-access-basics', title: 'Authentication vs Authorization', phase: 1, phaseTitle: 'Foundations', level: 'Beginner', orderIndex: 4, specialization: 'awareness', concepts: ['identity', 'authentication', 'authorization', 'least privilege'] },
  { slug: 'passwords-mfa-and-phishing', title: 'Passwords, MFA, and Phishing Defense', phase: 1, phaseTitle: 'Foundations', level: 'Beginner', orderIndex: 5, specialization: 'awareness', concepts: ['password hygiene', 'mfa', 'phishing', 'backups'] },
  { slug: 'device-hygiene', title: 'Digital Safety and Device Hygiene', phase: 1, phaseTitle: 'Foundations', level: 'Beginner', orderIndex: 6, specialization: 'awareness', concepts: ['updates', 'device hygiene', 'backups', 'safe browsing'] },
  { slug: 'computer-basics', title: 'Computer Basics for Security', phase: 2, phaseTitle: 'Technical Core', level: 'Beginner', orderIndex: 1, specialization: 'security engineering', concepts: ['hardware', 'software', 'memory', 'storage'] },
  { slug: 'operating-systems-and-files', title: 'Operating Systems, Files, and Permissions', phase: 2, phaseTitle: 'Technical Core', level: 'Beginner', orderIndex: 2, specialization: 'security engineering', concepts: ['operating systems', 'file systems', 'permissions', 'processes'] },
  { slug: 'linux-windows-basics', title: 'Linux and Windows Basics', phase: 2, phaseTitle: 'Technical Core', level: 'Beginner', orderIndex: 3, specialization: 'security engineering', concepts: ['linux basics', 'windows basics', 'logs', 'users and groups'] },
  { slug: 'networking-fundamentals', title: 'Networking Fundamentals', phase: 2, phaseTitle: 'Technical Core', level: 'Intermediate', orderIndex: 4, specialization: 'SOC', concepts: ['ip', 'dns', 'http and https', 'ports and packets'] },
  { slug: 'browser-and-web-basics', title: 'Browser and Web Basics', phase: 2, phaseTitle: 'Technical Core', level: 'Intermediate', orderIndex: 5, specialization: 'AppSec', concepts: ['browser', 'request response', 'cookies', 'web basics'] },
  { slug: 'python-bash-and-apis', title: 'Python, Bash, JSON, APIs, and Regex', phase: 2, phaseTitle: 'Technical Core', level: 'Intermediate', orderIndex: 6, specialization: 'security engineering', concepts: ['python basics', 'bash basics', 'json and apis', 'regex'] },
  { slug: 'least-privilege-and-defense-in-depth', title: 'Least Privilege and Defense in Depth', phase: 3, phaseTitle: 'Security Fundamentals and Blue Team', level: 'Intermediate', orderIndex: 1, specialization: 'SOC', concepts: ['least privilege', 'defense in depth', 'layered controls', 'segmentation'] },
  { slug: 'patching-vuln-management', title: 'Patching and Vulnerability Management', phase: 3, phaseTitle: 'Security Fundamentals and Blue Team', level: 'Intermediate', orderIndex: 2, specialization: 'SOC', concepts: ['patching cadence', 'vulnerability management', 'prioritization', 'remediation workflow'] },
  { slug: 'iam-encryption-and-keys', title: 'IAM, Encryption, Hashing, Keys, and Certificates', phase: 3, phaseTitle: 'Security Fundamentals and Blue Team', level: 'Intermediate', orderIndex: 3, specialization: 'cloud security', concepts: ['iam basics', 'hashing vs encryption', 'public and private keys', 'certificates'] },
  { slug: 'logging-siem-edr-ir', title: 'Logging, SIEM, EDR, and Incident Response', phase: 3, phaseTitle: 'Security Fundamentals and Blue Team', level: 'Intermediate', orderIndex: 4, specialization: 'incident responder', concepts: ['logging', 'siem', 'edr', 'incident response lifecycle'] },
  { slug: 'how-web-apps-work', title: 'How Web Apps Work', phase: 4, phaseTitle: 'Web, AppSec, and Cloud', level: 'Intermediate', orderIndex: 1, specialization: 'AppSec', concepts: ['browser', 'server', 'state', 'apis'] },
  { slug: 'sessions-cookies-and-auth-flows', title: 'Sessions, Cookies, Tokens, and Auth Flows', phase: 4, phaseTitle: 'Web, AppSec, and Cloud', level: 'Intermediate', orderIndex: 2, specialization: 'AppSec', concepts: ['sessions', 'cookies', 'tokens', 'auth flows'] },
  { slug: 'owasp-style-risks', title: 'OWASP-Style Risks and Secure Coding', phase: 4, phaseTitle: 'Web, AppSec, and Cloud', level: 'Advanced', orderIndex: 3, specialization: 'AppSec', concepts: ['broken access control', 'misconfiguration', 'injection', 'logging failures'] },
  { slug: 'cloud-iam-and-containers', title: 'Cloud Basics, IAM, Secrets, and Containers', phase: 4, phaseTitle: 'Web, AppSec, and Cloud', level: 'Advanced', orderIndex: 4, specialization: 'cloud security', concepts: ['cloud basics', 'iam in cloud', 'secrets management', 'containers'] },
  { slug: 'reporting-and-ethics', title: 'Reporting, Documentation, and Ethics', phase: 5, phaseTitle: 'Professionalization', level: 'Intermediate', orderIndex: 1, specialization: 'GRC', concepts: ['reporting', 'documentation', 'ethics', 'authorization boundaries'] },
  { slug: 'risk-privacy-bcdr', title: 'Risk, Privacy, Business Continuity, and Disaster Recovery', phase: 5, phaseTitle: 'Professionalization', level: 'Intermediate', orderIndex: 2, specialization: 'GRC', concepts: ['risk assessment', 'privacy basics', 'business continuity', 'disaster recovery'] },
  { slug: 'specialization-tracks', title: 'Specialization Paths in Cybersecurity', phase: 5, phaseTitle: 'Professionalization', level: 'Intermediate', orderIndex: 3, specialization: 'career', concepts: ['soc analyst', 'security engineer', 'appsec', 'cloud security'] },
  { slug: 'capstones-and-interview-prep', title: 'Capstones, Portfolio Artifacts, and Interview Prep', phase: 5, phaseTitle: 'Professionalization', level: 'Advanced', orderIndex: 4, specialization: 'career', concepts: ['capstones', 'portfolio artifacts', 'interview prep', 'evidence'] }
];

const glossaryTerms = [
  ['Asset', 'Anything valuable that an organization relies on, such as data, systems, people, or brand trust.', 'Foundations'],
  ['Threat', 'A possible cause of harm, such as an attacker, a natural event, or an internal mistake.', 'Foundations'],
  ['Vulnerability', 'A weakness that could be exploited or accidentally triggered.', 'Foundations'],
  ['Risk', 'The combination of likelihood and impact when a threat meets a vulnerability.', 'Foundations'],
  ['Authentication', 'Proving who you are.', 'IAM'],
  ['Authorization', 'Determining what you are allowed to do after identity is known.', 'IAM'],
  ['Least Privilege', 'Giving only the minimum access needed to do the job.', 'IAM'],
  ['MFA', 'Multiple factors used to strengthen login security.', 'IAM'],
  ['DNS', 'A system that translates domain names into IP addresses.', 'Networking'],
  ['Port', 'A numbered endpoint used by network services.', 'Networking'],
  ['Packet', 'A chunk of network data moving between systems.', 'Networking'],
  ['Log', 'A recorded event produced by a system or application.', 'Blue Team'],
  ['SIEM', 'A platform that aggregates and analyzes security event data.', 'Blue Team'],
  ['EDR', 'Endpoint detection and response tooling for monitoring and investigating endpoints.', 'Blue Team'],
  ['Hashing', 'A one-way function used for integrity and password storage workflows.', 'Cryptography'],
  ['Encryption', 'Reversible transformation of data using a key so authorized users can recover the original data.', 'Cryptography'],
  ['Certificate', 'A digitally signed document that helps systems trust a public key.', 'Cryptography'],
  ['Cookie', 'Small data stored by the browser to help manage state.', 'Web'],
  ['Token', 'A credential artifact used to represent identity or authorization.', 'Web'],
  ['Broken Access Control', 'When users can reach actions or data they should not be able to access.', 'AppSec'],
  ['Misconfiguration', 'Unsafe settings that increase exposure without any exploit magic being required.', 'AppSec'],
  ['Secret', 'Sensitive authentication material such as API keys or database passwords.', 'Cloud'],
  ['Container', 'A lightweight packaged environment for running applications with dependencies.', 'Cloud'],
  ['Business Continuity', 'Keeping critical business functions running during disruption.', 'Professional'],
  ['Disaster Recovery', 'Restoring systems and data after major disruption.', 'Professional'],
  ['Phishing', 'A social engineering attempt to trick a person into unsafe action.', 'Awareness'],
  ['Incident Response', 'The structured process for handling security incidents.', 'Blue Team'],
  ['Patch', 'A software update intended to fix bugs or security issues.', 'Blue Team'],
  ['Regex', 'A pattern language used to match text.', 'Technical Core'],
  ['JSON', 'A structured text format commonly used to exchange data between systems.', 'Technical Core']
] as const;

const labs = [
  { slug: 'log-analysis-auth-spikes', title: 'Auth Log Spike Review', category: 'Log analysis', difficulty: 'Beginner', description: 'Review fictional login events and separate suspicious behavior from noisy but explainable events.', dataset: { source: 'fictional-auth.log', events: ['alex failed login 7 times from 203.0.113.10', 'backup-service success from known subnet'] }, tasks: [{ id: 'task1', prompt: 'Which event deserves triage first and why?', expectedKeywords: ['failed', 'repeated', 'unknown', 'triage'] }, { id: 'task2', prompt: 'What safe next step would you take?', expectedKeywords: ['validate', 'investigate', 'confirm', 'contain'] }], safeGuardrails: 'Fictional logs only. No live targets or offensive actions.', solutionOutline: 'Escalate repeated failed logins from unknown sources, validate user activity, and document evidence.' },
  { slug: 'phishing-inbox-identification', title: 'Phishing Inbox Identification', category: 'Phishing identification', difficulty: 'Beginner', description: 'Inspect a toy inbox and identify which message shows classic phishing indicators.', dataset: { emails: ['IT support asks to verify account at a misspelled domain', 'normal team update from internal domain'] }, tasks: [{ id: 'task1', prompt: 'Which message is suspicious?', expectedKeywords: ['misspelled', 'verify', 'urgent', 'domain'] }, { id: 'task2', prompt: 'Name two indicators.', expectedKeywords: ['domain', 'urgent', 'link', 'spoofed'] }], safeGuardrails: 'Educational simulation only. Focus on identification, not creating phishing content.', solutionOutline: 'Flag spoofed domains, urgency cues, and mismatched links.' },
  { slug: 'incident-triage-fake-edr', title: 'Fake EDR Incident Triage', category: 'Incident triage', difficulty: 'Intermediate', description: 'Read a fictional endpoint alert and decide what evidence is needed before containment.', dataset: { alert: 'Suspicious PowerShell execution from user workstation' }, tasks: [{ id: 'task1', prompt: 'What evidence would you ask for first?', expectedKeywords: ['parent process', 'command line', 'user', 'time'] }, { id: 'task2', prompt: 'What is a safe triage order?', expectedKeywords: ['validate', 'contain', 'isolate', 'collect evidence'] }], safeGuardrails: 'Toy alert only. Learn triage logic, not abuse workflows.', solutionOutline: 'Ask for host, user, parent process, and timing context. Validate, then isolate only if justified by risk.' },
  { slug: 'packet-analysis-fictional', title: 'Packet Analysis with Fictional Data', category: 'Packet analysis', difficulty: 'Intermediate', description: 'Review fictional network metadata and identify abnormal traffic without using real packet captures.', dataset: { flows: ['10.0.0.25 -> 203.0.113.20:4444', '10.0.0.25 -> 203.0.113.20:4444', '10.0.0.25 -> 198.51.100.5:443'] }, tasks: [{ id: 'task1', prompt: 'Which connection deserves review and why?', expectedKeywords: ['4444', 'repeated', 'abnormal', 'review'] }, { id: 'task2', prompt: 'Name one benign explanation and one suspicious explanation.', expectedKeywords: ['legitimate', 'service', 'unauthorized', 'unexpected'] }], safeGuardrails: 'Fictional traffic only. The skill is interpretation, not offensive usage.', solutionOutline: 'Flag repeated outbound port 4444 traffic and balance investigation with context.' },
  { slug: 'secure-coding-toy-fix', title: 'Secure Coding Toy Fix', category: 'Secure coding review', difficulty: 'Advanced', description: 'Read a tiny toy code snippet and explain a safe remediation.', dataset: { code: "app.get('/admin', (req, res) => { return res.send(secretData); })" }, tasks: [{ id: 'task1', prompt: 'What is the likely issue?', expectedKeywords: ['access control', 'authorization', 'missing check'] }, { id: 'task2', prompt: 'What would a safe fix include?', expectedKeywords: ['authorize', 'role', 'least privilege', 'check'] }], safeGuardrails: 'Use toy code only. Focus on safe remediation and code review thinking.', solutionOutline: 'Identify missing authorization and recommend an explicit role or permission check.' },
  { slug: 'mock-cloud-iam-review', title: 'Mock Cloud IAM Review', category: 'Cloud/IAM review', difficulty: 'Advanced', description: 'Inspect a fake cloud dashboard summary and reduce excessive privilege.', dataset: { roles: [{ user: 'intern-app', permission: 'admin' }, { user: 'billing-job', permission: 'read-billing' }] }, tasks: [{ id: 'task1', prompt: 'Which assignment violates least privilege?', expectedKeywords: ['intern', 'admin', 'least privilege'] }, { id: 'task2', prompt: 'What should change?', expectedKeywords: ['reduce', 'specific', 'scope', 'role'] }], safeGuardrails: 'No real cloud accounts are involved. This is purely a defensive least-privilege review.', solutionOutline: 'Downgrade the over-privileged identity and replace broad rights with scoped access.' },
  { slug: 'misconfiguration-review-demo', title: 'Demo Misconfiguration Review', category: 'Misconfiguration review', difficulty: 'Intermediate', description: 'Review a fake server checklist and identify unsafe defaults.', dataset: { checklist: ['Default admin password unchanged', 'Automatic updates disabled', 'MFA enabled for admins'] }, tasks: [{ id: 'task1', prompt: 'Name two unsafe defaults.', expectedKeywords: ['default password', 'updates disabled'] }, { id: 'task2', prompt: 'What remediation order makes sense?', expectedKeywords: ['password', 'update', 'mfa', 'priority'] }], safeGuardrails: 'The configuration is fictional. The point is safe review and prioritization.', solutionOutline: 'Fix default credentials first, restore updates, and keep strong authentication in place.' },
  { slug: 'demo-access-review', title: 'Demo Access Control Review', category: 'Access control review', difficulty: 'Intermediate', description: 'Inspect a toy app role matrix and spot broken access control.', dataset: { matrix: [{ role: 'student', action: 'view own progress', allowed: true }, { role: 'student', action: 'edit all users', allowed: true }] }, tasks: [{ id: 'task1', prompt: 'Which permission is wrong?', expectedKeywords: ['student', 'edit all users', 'wrong'] }, { id: 'task2', prompt: 'Which principle is violated?', expectedKeywords: ['least privilege', 'authorization', 'access control'] }], safeGuardrails: 'This is a demo app. Focus on safe design review only.', solutionOutline: 'Remove broad admin-like power from student role and enforce proper authorization.' }
] as const;

const capstones = [
  { title: 'SOC Alert Triage Portfolio', specialization: 'SOC analyst', summary: 'Build a mini report pack that classifies fictional alerts, explains severity, and proposes next steps.', deliverables: ['triage worksheet', 'evidence notes', 'final incident summary'], difficulty: 'Intermediate' },
  { title: 'Secure Web Review Journal', specialization: 'AppSec analyst', summary: 'Review a toy web app for broken access control, misconfiguration, and weak session handling.', deliverables: ['risk table', 'remediation notes', 'before-after explanation'], difficulty: 'Advanced' },
  { title: 'Cloud IAM Hardening Blueprint', specialization: 'cloud security', summary: 'Shrink excessive permissions in a mock cloud environment and justify each change.', deliverables: ['role inventory', 'least-privilege redesign', 'executive summary'], difficulty: 'Advanced' },
  { title: 'Incident Response Evidence Pack', specialization: 'incident responder', summary: 'Use fictional logs and host notes to produce a timeline and containment recommendation.', deliverables: ['timeline', 'scope statement', 'containment proposal'], difficulty: 'Intermediate' },
  { title: 'Risk and Privacy Mini Assessment', specialization: 'GRC analyst', summary: 'Assess a fictional service for key risks, privacy concerns, and continuity requirements.', deliverables: ['risk register', 'privacy observations', 'continuity controls'], difficulty: 'Intermediate' }
] as const;

function buildLessonRecord(item: LessonBlueprint) {
  return {
    ...item,
    estimatedMinutes: 22,
    learningObjectives: [
      `Define ${item.concepts[0]} in plain language.`,
      `Explain how ${item.concepts[1]} affects defensive work.`,
      `Spot a common mistake around ${item.concepts[2]}.`,
      `Connect ${item.concepts[3]} to a real security workflow.`
    ],
    content: `${item.title} teaches the learner to think defensively, distinguish core terminology, and connect abstract cyber ideas to day-to-day work. This lesson explains ${item.concepts.join(', ')} with practical examples, safe analogies, and real-world defensive reasoning. Every section keeps the boundary clear: learn in authorized, sandboxed environments, document evidence carefully, and focus on reducing risk instead of chasing flashy attack narratives.`,
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
    commonMistakes: `Learners often memorize the phrase ${item.concepts[2]} without understanding when it changes the defensive decision. Use context and evidence instead.`,
    whyItMatters: `${item.title} matters because professionals do not get paid for vague cyber vocabulary. They get paid for accurate judgment, clean communication, and safer decisions under pressure.`
  };
}

function buildQuestionsForLesson(lessonId: string, lesson: ReturnType<typeof buildLessonRecord>) {
  return [
    {
      id: makeId(), lessonId, prompt: `Which option best matches ${lesson.concepts[0]} in this lesson?`, type: 'multiple-choice', difficulty: lesson.level, topic: lesson.phaseTitle, subtopic: lesson.concepts[0], explanation: `${lesson.concepts[0]} is the most direct match based on the lesson definition.`, scenarioContext: null,
      options: [
        { id: 'a', label: `${lesson.concepts[0]} as the directly relevant concept` },
        { id: 'b', label: 'A loosely related but incorrect idea' },
        { id: 'c', label: 'A distracting detail that sounds technical' },
        { id: 'd', label: 'A broad answer with weak precision' }
      ], answer: 'a'
    },
    {
      id: makeId(), lessonId, prompt: `Select all defensive ideas that align with ${lesson.concepts[1]} and ${lesson.concepts[3]}.`, type: 'multi-select', difficulty: lesson.level, topic: lesson.phaseTitle, subtopic: lesson.concepts[1], explanation: 'The correct options reinforce safer process and constrained decision-making.', scenarioContext: null,
      options: [
        { id: 'a', label: 'Use evidence and least-risk judgment' },
        { id: 'b', label: 'Skip documentation if you feel confident' },
        { id: 'c', label: 'Prefer authorized sandbox learning' },
        { id: 'd', label: 'Assume vague intuition is enough' }
      ], answer: ['a', 'c']
    },
    {
      id: makeId(), lessonId, prompt: `${lesson.concepts[2]} should be understood in context rather than memorized as empty jargon.`, type: 'true-false', difficulty: lesson.level, topic: lesson.phaseTitle, subtopic: lesson.concepts[2], explanation: 'True. Cyber learning gets useful only when terms connect to decisions and evidence.', scenarioContext: null, options: [], answer: true
    },
    {
      id: makeId(), lessonId, prompt: `In a short response, explain why ${lesson.concepts[3]} matters in real work.`, type: 'short-response', difficulty: lesson.level, topic: lesson.phaseTitle, subtopic: lesson.concepts[3], explanation: 'A strong answer mentions safer decisions, clearer communication, or reduced risk.', scenarioContext: null, options: [], answer: 'reduced risk'
    }
  ];
}


const specializationTracks = [
  {
    slug: 'soc-analyst',
    title: 'SOC Analyst Career Path',
    trackType: 'career',
    estimatedHours: 32,
    hero: 'Move from raw alerts to defensible triage notes, timeline building, and first-response discipline.',
    level: 'Intermediate',
    description: 'Alert triage, log review, phishing analysis, and first-response workflow discipline.',
    frameworkRef: 'NICE / Defensive Operations',
    targetRoles: ['SOC Analyst', 'Tier 1 Analyst', 'Security Operations Intern'],
    milestones: ['Handle alert triage cleanly', 'Write an incident memo', 'Recognize phishing patterns'],
    outcomes: ['Produce a clean alert investigation note', 'Separate evidence from inference under pressure', 'Escalate safely without overclaiming'],
    skills: ['log analysis', 'triage judgment', 'phishing investigation', 'incident communication'],
    lessonSlugs: ['networking-fundamentals', 'least-privilege-and-defense-in-depth', 'patching-vuln-management', 'logging-siem-edr-ir', 'reporting-and-ethics', 'capstones-and-interview-prep']
  },
  {
    slug: 'security-engineer',
    title: 'Security Engineer Career Path',
    trackType: 'career',
    estimatedHours: 36,
    hero: 'Build platform judgment: hardening, permissions, safe automation, and defensive design trade-offs.',
    level: 'Intermediate',
    description: 'System hardening, platform thinking, safe automation, and defense-in-depth design.',
    frameworkRef: 'NICE / Security Engineering',
    targetRoles: ['Security Engineer', 'Platform Security Analyst'],
    milestones: ['Harden core systems', 'Explain permissions precisely', 'Automate safe checks'],
    outcomes: ['Read operating-system evidence without panic', 'Design safer defaults for core infrastructure', 'Use scripting for defensive workflow acceleration'],
    skills: ['os fundamentals', 'permissions', 'defense in depth', 'python and bash'],
    lessonSlugs: ['computer-basics', 'operating-systems-and-files', 'linux-windows-basics', 'python-bash-and-apis', 'least-privilege-and-defense-in-depth', 'patching-vuln-management']
  },
  {
    slug: 'appsec-analyst',
    title: 'AppSec Analyst Career Path',
    trackType: 'career',
    estimatedHours: 34,
    hero: 'Learn how trust breaks in web systems, then turn that judgment into safer design and remediation notes.',
    level: 'Advanced',
    description: 'How applications work, where trust breaks, and how to communicate safer fixes.',
    frameworkRef: 'OWASP 2025-aligned',
    targetRoles: ['AppSec Analyst', 'Product Security Analyst'],
    milestones: ['Map web flows', 'Spot access control failures', 'Write secure-fix notes'],
    outcomes: ['Explain sessions and tokens clearly', 'Review a toy app without harmful exploitation framing', 'Translate web risk into developer-facing action'],
    skills: ['web architecture', 'sessions and tokens', 'owasp risks', 'secure coding review'],
    lessonSlugs: ['browser-and-web-basics', 'how-web-apps-work', 'sessions-cookies-and-auth-flows', 'owasp-style-risks', 'reporting-and-ethics', 'capstones-and-interview-prep']
  },
  {
    slug: 'cloud-security',
    title: 'Cloud Security Career Path',
    trackType: 'career',
    estimatedHours: 28,
    hero: 'Work through IAM, secrets, containers, and configuration review in cloud-style environments.',
    level: 'Advanced',
    description: 'IAM, secrets, containers, and misconfiguration review in cloud-style environments.',
    frameworkRef: 'Cloud IAM / Shared Responsibility',
    targetRoles: ['Cloud Security Analyst', 'Cloud Security Engineer'],
    milestones: ['Review IAM safely', 'Spot secrets risk', 'Explain container exposure'],
    outcomes: ['Reason about blast radius and role boundaries', 'Recognize config drift and secrets exposure', 'Write safer remediation guidance for cloud teams'],
    skills: ['cloud basics', 'cloud IAM', 'secrets management', 'containers'],
    lessonSlugs: ['iam-encryption-and-keys', 'cloud-iam-and-containers', 'risk-privacy-bcdr', 'reporting-and-ethics']
  },
  {
    slug: 'grc-analyst',
    title: 'GRC Analyst Career Path',
    trackType: 'career',
    estimatedHours: 24,
    hero: 'Turn vague business risk into precise, evidence-based reporting and control language.',
    level: 'Intermediate',
    description: 'Risk language, policy discipline, privacy basics, and evidence-based reporting.',
    frameworkRef: 'Risk / Governance Basics',
    targetRoles: ['GRC Analyst', 'Risk Analyst', 'Compliance Analyst'],
    milestones: ['Frame risk cleanly', 'Write a control gap note', 'Communicate business impact'],
    outcomes: ['Build a simple risk register', 'Explain privacy and continuity basics in plain language', 'Write controls without empty jargon'],
    skills: ['risk assessment', 'privacy basics', 'documentation', 'business continuity'],
    lessonSlugs: ['risk-assets-threats', 'reporting-and-ethics', 'risk-privacy-bcdr', 'specialization-tracks', 'capstones-and-interview-prep']
  },
  {
    slug: 'phishing-triage-sprint',
    title: 'Phishing Triage Skill Path',
    trackType: 'skill',
    estimatedHours: 6,
    hero: 'A short, high-signal sprint for recognizing suspicious messages and documenting safe escalation.',
    level: 'Beginner',
    description: 'Short roadmap for learners who need rapid confidence in phishing review and reporting discipline.',
    frameworkRef: 'Skill Path / Defensive Email Review',
    targetRoles: ['Awareness learner', 'SOC trainee'],
    milestones: ['Identify suspicious indicators', 'Separate urgent from important', 'Escalate with evidence'],
    outcomes: ['Spot common phishing pressure tactics', 'Write a short, calm escalation note', 'Practice safe verification instead of guessing'],
    skills: ['phishing review', 'signal spotting', 'escalation'],
    lessonSlugs: ['passwords-mfa-and-phishing', 'device-hygiene', 'logging-siem-edr-ir', 'reporting-and-ethics']
  },
  {
    slug: 'identity-access-sprint',
    title: 'Identity & Access Skill Path',
    trackType: 'skill',
    estimatedHours: 7,
    hero: 'Quickly build precision around authentication, authorization, least privilege, and cloud IAM.',
    level: 'Beginner',
    description: 'Compact path for learners who keep confusing identity terms and access-control decisions.',
    frameworkRef: 'Skill Path / IAM Foundations',
    targetRoles: ['Helpdesk-to-security switcher', 'Cloud trainee'],
    milestones: ['Stop mixing authN and authZ', 'Apply least privilege', 'Read IAM risk in context'],
    outcomes: ['Explain identity basics without confusion', 'Recognize over-privileged design choices', 'Use proper access-control language in reports'],
    skills: ['authentication', 'authorization', 'least privilege', 'cloud IAM'],
    lessonSlugs: ['identity-access-basics', 'least-privilege-and-defense-in-depth', 'iam-encryption-and-keys', 'cloud-iam-and-containers']
  },
  {
    slug: 'web-auth-review-sprint',
    title: 'Web Auth Review Skill Path',
    trackType: 'skill',
    estimatedHours: 8,
    hero: 'Short path for understanding sessions, cookies, tokens, and the trust mistakes that break web apps.',
    level: 'Intermediate',
    description: 'Focused web-auth sprint for learners who need application security context without a full career path.',
    frameworkRef: 'Skill Path / Web Auth & Session Security',
    targetRoles: ['Developer upskilling into security', 'AppSec trainee'],
    milestones: ['Map auth flow', 'Recognize session risk', 'Explain secure-fix priorities'],
    outcomes: ['Follow request-response state properly', 'Describe session and token trade-offs', 'Connect auth failures to business risk'],
    skills: ['web basics', 'sessions', 'tokens', 'auth flow review'],
    lessonSlugs: ['browser-and-web-basics', 'how-web-apps-work', 'sessions-cookies-and-auth-flows', 'owasp-style-risks']
  }
] as const;


const guidedProjects = [
  {
    slug: 'soc-alert-pack',
    title: 'SOC Alert Pack',
    specialization: 'SOC analyst',
    difficulty: 'Intermediate',
    summary: 'Turn fictional detections into a disciplined triage pack with severity, evidence, timeline, and escalation note.',
    estimatedHours: 6,
    checkpoints: ['Classify the alert', 'Collect evidence notes', 'Write the timeline', 'Draft the escalation memo'],
    rubric: ['Clear evidence vs inference separation', 'Safe next-step recommendation', 'Concise incident communication'],
    starterLessonSlug: 'logging-siem-edr-ir'
  },
  {
    slug: 'iam-hardening-memo',
    title: 'IAM Hardening Memo',
    specialization: 'cloud security',
    difficulty: 'Advanced',
    summary: 'Review a fake IAM environment, reduce blast radius, and justify the policy changes in business language.',
    estimatedHours: 5,
    checkpoints: ['Identify excess privilege', 'Map blast radius', 'Propose least-privilege redesign', 'Write executive summary'],
    rubric: ['Least-privilege reasoning', 'Business impact clarity', 'Concrete remediation path'],
    starterLessonSlug: 'cloud-iam-and-containers'
  },
  {
    slug: 'appsec-fix-brief',
    title: 'AppSec Fix Brief',
    specialization: 'AppSec analyst',
    difficulty: 'Advanced',
    summary: 'Review a toy web issue, describe the risk cleanly, and produce a developer-facing fix brief.',
    estimatedHours: 5,
    checkpoints: ['Describe the trust boundary', 'Explain the flaw', 'Draft the fix guidance', 'Capture verification steps'],
    rubric: ['No harmful exploitation detail', 'Developer-friendly explanation', 'Verification thinking'],
    starterLessonSlug: 'owasp-style-risks'
  }
] as const;

const cohortSeeds = [
  {
    slug: 'spring-foundations-cohort',
    title: 'Spring Foundations Cohort',
    description: 'A paced group for learners pushing through foundations into their first specialization signals.',
    startDate: '2026-04-01',
    endDate: '2026-06-30'
  }
] as const;

const portfolioTemplates = [
  {
    title: 'Incident Triage Memo',
    artifactType: 'incident-report',
    specialization: 'SOC analyst',
    summary: 'A short evidence-based triage memo summarizing suspicious authentication activity, likely impact, and the next safe containment step.',
    deliverables: ['triage summary', 'timeline', 'recommended containment', 'communication note'],
    status: 'in_review',
    evidenceUrl: 'https://portfolio.local/incident-triage-memo',
    mentorFeedback: 'Good structure. Tighten the distinction between evidence, inference, and recommendation.'
  },
  {
    title: 'IAM Reduction Plan',
    artifactType: 'iam-review',
    specialization: 'cloud security',
    summary: 'A least-privilege clean-up plan for a fictional cloud environment with excessive permissions and weak role boundaries.',
    deliverables: ['current-state access map', 'risk summary', 'proposed role changes'],
    status: 'draft',
    evidenceUrl: null,
    mentorFeedback: null
  }
] as const;

async function main() {
  initDb();

  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM platform_feedback;
    DELETE FROM email_outbox;
    DELETE FROM subscriptions;
    DELETE FROM password_reset_tokens;
    DELETE FROM mentor_alerts;
    DELETE FROM mentor_assignments;
    DELETE FROM review_queue;
    DELETE FROM learner_projects;
    DELETE FROM guided_projects;
    DELETE FROM lesson_revisions;
    DELETE FROM cohort_members;
    DELETE FROM cohorts;
    DELETE FROM certificate_awards;
    DELETE FROM portfolio_artifacts;
    DELETE FROM mentor_feedback;
    DELETE FROM mentor_students;
    DELETE FROM lab_submissions;
    DELETE FROM labs;
    DELETE FROM mistakes;
    DELETE FROM quiz_attempts;
    DELETE FROM lesson_progress;
    DELETE FROM quiz_questions;
    DELETE FROM track_lesson_links;
    DELETE FROM specialization_tracks;
    DELETE FROM lessons;
    DELETE FROM glossary_terms;
    DELETE FROM capstone_ideas;
    DELETE FROM users;
  `);

  const studentPassword = await bcrypt.hash('Student123!', 10);
  const mentorPassword = await bcrypt.hash('Mentor123!', 10);
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const now = nowIso();

  const studentId = makeId();
  const studentTwoId = makeId();
  const mentorId = makeId();
  const adminId = makeId();

  run(`INSERT INTO users (id, name, email, password_hash, role, goal, experience_level, placement_score, roadmap_json, streak_days, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, studentId, 'Amina Student', 'student@cyberpath.local', studentPassword, 'student', 'SOC', 'beginner', 58, toDbJson(buildRoadmap('SOC', 'beginner', 58)), 4, now, now);
  run(`INSERT INTO users (id, name, email, password_hash, role, goal, experience_level, placement_score, roadmap_json, streak_days, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, studentTwoId, 'Leo Learner', 'student2@cyberpath.local', studentPassword, 'student', 'AppSec', 'intermediate', 72, toDbJson(buildRoadmap('AppSec', 'intermediate', 72)), 2, now, now);
  run(`INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, mentorId, 'Mira Mentor', 'mentor@cyberpath.local', mentorPassword, 'mentor', now, now);
  run(`INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, adminId, 'Alex Admin', 'admin@cyberpath.local', adminPassword, 'admin', now, now);

  run('INSERT INTO mentor_students (id, mentor_id, student_id, created_at) VALUES (?, ?, ?, ?)', makeId(), mentorId, studentId, now);
  run('INSERT INTO mentor_students (id, mentor_id, student_id, created_at) VALUES (?, ?, ?, ?)', makeId(), mentorId, studentTwoId, now);

  run(`INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, current_period_end, created_at, updated_at) VALUES (?, ?, 'pro', 'active', 'monthly', ?, ?, ?)`, makeId(), studentId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), now, now);
  run(`INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, current_period_end, created_at, updated_at) VALUES (?, ?, 'starter', 'trialing', 'monthly', ?, ?, ?)`, makeId(), studentTwoId, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), now, now);
  run(`INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, current_period_end, created_at, updated_at) VALUES (?, ?, 'mentor-plus', 'active', 'monthly', ?, ?, ?)`, makeId(), mentorId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), now, now);

  const createdLessons: Array<{ id: string; slug: string; title: string; phaseTitle: string }> = [];
  const lessonIdBySlug = new Map<string, string>();

  for (const blueprint of lessonBlueprints) {
    const lesson = buildLessonRecord(blueprint);
    const lessonId = makeId();
    createdLessons.push({ id: lessonId, slug: lesson.slug, title: lesson.title, phaseTitle: lesson.phaseTitle });
    lessonIdBySlug.set(lesson.slug, lessonId);
    run(
      `INSERT INTO lessons (id, slug, title, phase, phase_title, level, order_index, specialization, estimated_minutes, learning_objectives, content, glossary, examples, knowledge_checks, common_mistakes, why_it_matters, icon, version, last_reviewed_at, review_due_at, reviewed_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'shield', 1, ?, ?, ?, ?, ?)`,
      lessonId,
      lesson.slug,
      lesson.title,
      lesson.phase,
      lesson.phaseTitle,
      lesson.level,
      lesson.orderIndex,
      lesson.specialization,
      lesson.estimatedMinutes,
      toDbJson(lesson.learningObjectives),
      lesson.content,
      toDbJson(lesson.glossary),
      toDbJson(lesson.examples),
      toDbJson(lesson.knowledgeChecks),
      lesson.commonMistakes,
      lesson.whyItMatters,
      now,
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      adminId,
      now,
      now
    );

    run(
      `INSERT INTO lesson_revisions (id, lesson_id, version, snapshot_json, change_summary, created_by, created_at)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      makeId(),
      lessonId,
      toDbJson(lesson),
      'Initial seeded lesson',
      adminId,
      now
    );

    for (const question of buildQuestionsForLesson(lessonId, lesson)) {
      run(
        `INSERT INTO quiz_questions (id, lesson_id, prompt, type, difficulty, topic, subtopic, explanation, scenario_context, options, answer, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        question.id,
        lessonId,
        question.prompt,
        question.type,
        question.difficulty,
        question.topic,
        question.subtopic,
        question.explanation,
        question.scenarioContext,
        toDbJson(question.options),
        toDbJson(question.answer),
        now
      );
    }
  }

  for (const [term, definition, category] of glossaryTerms) {
    run('INSERT INTO glossary_terms (id, term, definition, category) VALUES (?, ?, ?, ?)', makeId(), term, definition, category);
  }

  for (const lab of labs) {
    run(
      `INSERT INTO labs (id, slug, title, category, difficulty, description, dataset, tasks, safe_guardrails, solution_outline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      lab.slug,
      lab.title,
      lab.category,
      lab.difficulty,
      lab.description,
      toDbJson(lab.dataset),
      toDbJson(lab.tasks),
      lab.safeGuardrails,
      lab.solutionOutline
    );
  }

  for (const track of specializationTracks) {
    const trackId = makeId();
    run(
      `INSERT INTO specialization_tracks (id, slug, title, level, description, framework_ref, track_type, estimated_hours, hero, target_roles, milestone_json, skills_json, outcomes_json, entry_points_json, prerequisites_json, recommended_for_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      trackId,
      track.slug,
      track.title,
      track.level,
      track.description,
      track.frameworkRef,
      track.trackType,
      track.estimatedHours,
      track.hero,
      toDbJson(track.targetRoles),
      toDbJson(track.milestones),
      toDbJson(track.skills),
      toDbJson(track.outcomes),
      toDbJson((track as any).entryPoints ?? ['absolute beginner', 'career switcher']),
      toDbJson((track as any).prerequisites ?? ['Complete foundations', 'Finish at least one quiz in the track']),
      toDbJson((track as any).recommendedFor ?? track.targetRoles),
      now
    );

    track.lessonSlugs.forEach((slug, index) => {
      const lessonId = lessonIdBySlug.get(slug);
      if (!lessonId) return;
      run(
        `INSERT INTO track_lesson_links (id, track_id, lesson_id, competency, weight)
         VALUES (?, ?, ?, ?, ?)`,
        makeId(),
        trackId,
        lessonId,
        track.skills[Math.min(index, track.skills.length - 1)],
        1 + index
      );
    });
  }

  for (const capstone of capstones) {
    run(
      'INSERT INTO capstone_ideas (id, title, specialization, summary, deliverables, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
      makeId(),
      capstone.title,
      capstone.specialization,
      capstone.summary,
      toDbJson(capstone.deliverables),
      capstone.difficulty
    );
  }


  for (const project of guidedProjects) {
    run(
      `INSERT INTO guided_projects (id, slug, title, specialization, difficulty, summary, estimated_hours, checkpoints_json, rubric_json, starter_lesson_slug, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      project.slug,
      project.title,
      project.specialization,
      project.difficulty,
      project.summary,
      project.estimatedHours,
      toDbJson(project.checkpoints),
      toDbJson(project.rubric),
      project.starterLessonSlug,
      now
    );
  }

  createdLessons.slice(0, 8).forEach((lesson, index) => {
    const completed = index < 6;
    const completedAt = completed ? new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString() : null;
    run(
      `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at, time_spent_minutes, last_opened_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      studentId,
      lesson.id,
      completed ? 1 : 0,
      completedAt,
      20 + index * 8,
      now
    );

    run(
      `INSERT INTO quiz_attempts (id, user_id, lesson_id, score, accuracy, difficulty, time_spent_minutes, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      studentId,
      lesson.id,
      index < 5 ? 85 : 65,
      (index < 5 ? 85 : 65) / 100,
      index < 5 ? 'confident' : 'developing',
      10 + index,
      toDbJson({ totalQuestions: 4, correct: index < 5 ? 3 : 2, topicScores: { [lesson.phaseTitle]: index < 5 ? 82 : 68 }, review: [] }),
      completedAt ?? now
    );
  });

  const weakQuestions = db.prepare('SELECT id, lesson_id, topic, subtopic, prompt, explanation, answer FROM quiz_questions ORDER BY created_at ASC LIMIT 3').all() as Array<Record<string, unknown>>;
  weakQuestions.forEach((question, index) => {
    const timestamp = new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString();
    run(
      `INSERT INTO mistakes (id, user_id, lesson_id, question_id, topic, subtopic, prompt, explanation, user_answer, correct_answer, notes, repeat_count, last_seen_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      studentId,
      String(question.lesson_id),
      String(question.id),
      String(question.topic),
      String(question.subtopic),
      String(question.prompt),
      String(question.explanation),
      toDbJson('demo wrong answer'),
      String(question.answer),
      index === 0 ? 'I confused the core definition with a broad related term.' : '',
      index === 1 ? 3 : 2,
      timestamp,
      timestamp
    );
  });

  const labRows = db.prepare('SELECT id FROM labs LIMIT 3').all() as Array<Record<string, unknown>>;
  labRows.forEach((lab, index) => {
    run(
      `INSERT INTO lab_submissions (id, user_id, lab_id, answers, score, feedback, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      studentId,
      String(lab.id),
      toDbJson({ sample: 'demo' }),
      78 - index * 3,
      'Good defensive instincts. Tighten evidence collection and be more explicit about the next safe action.',
      new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString()
    );
  });

  run('INSERT INTO mentor_feedback (id, mentor_id, student_id, message, created_at) VALUES (?, ?, ?, ?, ?)', makeId(), mentorId, studentId, 'Strong momentum. Your triage reasoning is improving, but your terminology is still slightly loose in IAM and risk.', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString());
  run('INSERT INTO mentor_feedback (id, mentor_id, student_id, message, created_at) VALUES (?, ?, ?, ?, ?)', makeId(), mentorId, studentTwoId, 'Good AppSec intuition. Next step: explain broken access control more precisely and document safer fixes.', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

  const cohortId = makeId();
  const cohortSeed = cohortSeeds[0];
  run(
    'INSERT INTO cohorts (id, slug, name, description, mentor_id, cadence, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    cohortId,
    cohortSeed.slug,
    cohortSeed.title,
    cohortSeed.description,
    mentorId,
    'weekly',
    cohortSeed.startDate,
    cohortSeed.endDate,
    now
  );

  run('INSERT INTO cohort_members (id, cohort_id, user_id, membership_role, joined_at) VALUES (?, ?, ?, ?, ?)', makeId(), cohortId, mentorId, 'mentor', now);
  run('INSERT INTO cohort_members (id, cohort_id, user_id, membership_role, joined_at) VALUES (?, ?, ?, ?, ?)', makeId(), cohortId, studentId, 'student', now);
  run('INSERT INTO cohort_members (id, cohort_id, user_id, membership_role, joined_at) VALUES (?, ?, ?, ?, ?)', makeId(), cohortId, studentTwoId, 'student', now);

  for (const template of portfolioTemplates) {
    run(
      `INSERT INTO portfolio_artifacts (id, user_id, title, artifact_type, specialization, summary, deliverables_json, status, evidence_url, mentor_feedback, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      studentId,
      template.title,
      template.artifactType,
      template.specialization,
      template.summary,
      toDbJson(template.deliverables),
      template.status,
      template.evidenceUrl,
      template.mentorFeedback,
      now,
      now
    );
  }

  run(
    'INSERT INTO certificate_awards (id, user_id, track_slug, title, status, criteria_json, issued_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    makeId(),
    studentId,
    'soc-analyst',
    'SOC Analyst Readiness Certificate',
    'issued',
    toDbJson({ score: 84, completionRate: 70, quizAverage: 81 }),
    now,
    now,
    now
  );

  run(
    `INSERT INTO mentor_alerts (id, student_id, mentor_id, cohort_id, alert_type, severity, summary, recommendation, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    makeId(),
    studentId,
    mentorId,
    cohortId,
    'repeat-mistakes',
    'high',
    'Repeated misses in networking and triage topics are holding back SOC readiness.',
    'Assign a targeted review quiz, one phishing lab, and require a short triage memo.',
    'open',
    now,
    now
  );
  run(
    `INSERT INTO mentor_alerts (id, student_id, mentor_id, cohort_id, alert_type, severity, summary, recommendation, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    makeId(),
    studentTwoId,
    mentorId,
    cohortId,
    'streak-risk',
    'medium',
    'Learning streak is slipping and AppSec precision is plateauing.',
    'Review one access-control lesson, then comment on a secure-fix portfolio artifact.',
    'reviewing',
    now,
    now
  );

  const reviewLesson = createdLessons[1];
  if (reviewLesson) {
    run(
      `INSERT INTO review_queue (id, user_id, source_type, source_id, topic, subtopic, prompt, due_at, last_reviewed_at, interval_days, ease_factor, status, success_streak, created_at, updated_at)
       VALUES (?, ?, 'lesson', ?, ?, ?, ?, ?, ?, 2, 2.3, 'due', 0, ?, ?)`,
      makeId(),
      studentId,
      reviewLesson.id,
      reviewLesson.phaseTitle,
      reviewLesson.title,
      `Re-explain the core idea from ${reviewLesson.title}.`,
      now,
      now,
      now,
      now
    );
  }

  weakQuestions.slice(0, 2).forEach((question) => {
    run(
      `INSERT INTO review_queue (id, user_id, source_type, source_id, topic, subtopic, prompt, due_at, last_reviewed_at, interval_days, ease_factor, status, success_streak, created_at, updated_at)
       VALUES (?, ?, 'question', ?, ?, ?, ?, ?, ?, 1, 2.1, 'due', 0, ?, ?)`,
      makeId(),
      studentId,
      String(question.id),
      String(question.topic),
      String(question.subtopic),
      String(question.prompt),
      now,
      now,
      now,
      now
    );
  });

  const guidedRows = db.prepare('SELECT id, slug FROM guided_projects ORDER BY title ASC').all() as Array<Record<string, unknown>>;
  if (guidedRows[0]) {
    run(
      `INSERT INTO learner_projects (id, user_id, guided_project_id, status, checkpoint_progress_json, reflection, evidence_url, created_at, updated_at)
       VALUES (?, ?, ?, 'in_progress', ?, ?, ?, ?, ?)`,
      makeId(),
      studentId,
      String(guidedRows[0].id),
      toDbJson(['Classify the alert']),
      'I can separate evidence from guesswork better than before, but my incident memo is still too broad.',
      'https://example.com/demo/soc-pack',
      now,
      now
    );
  }

  run(
    `INSERT INTO mentor_assignments (id, mentor_id, student_id, lesson_id, track_slug, title, instructions, target_mastery, due_at, status, rubric_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
    makeId(),
    mentorId,
    studentId,
    createdLessons[3]?.id ?? null,
    'identity-access-sprint',
    'Tighten auth vs authorization precision',
    'Review the identity lesson, explain the difference in your own words, and score at least 80 on the next retry.',
    80,
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    toDbJson(['Correctly define authN vs authZ', 'Use least-privilege language', 'Complete one retry quiz at 80%+']),
    now,
    now
  );

  console.log('Seeded CyberPath Academy.');
  console.log('Demo accounts:');
  console.log('student@cyberpath.local / Student123!');
  console.log('student2@cyberpath.local / Student123!');
  console.log('mentor@cyberpath.local / Mentor123!');
  console.log('admin@cyberpath.local / Admin123!');
  console.log(`Created ${lessonBlueprints.length} lessons, ${lessonBlueprints.length * 4} quiz questions, ${labs.length} labs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
