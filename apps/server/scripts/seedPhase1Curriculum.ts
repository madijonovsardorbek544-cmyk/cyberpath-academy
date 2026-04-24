import { initDb, makeId, nowIso, one, run, toDbJson } from '../src/lib/db.js';

type CurriculumLesson = {
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  specialization: string;
  concepts: string[];
};

type CurriculumModule = {
  phase: number;
  phaseTitle: string;
  specialization: string;
  lessons: CurriculumLesson[];
};

const modules: CurriculumModule[] = [
  {
    phase: 1,
    phaseTitle: 'Cyber Foundations',
    specialization: 'foundations',
    lessons: [
      { title: 'Cybersecurity Mindset and Authorization', level: 'Beginner', specialization: 'foundations', concepts: ['defensive mindset', 'authorization boundaries', 'safe learning', 'evidence-first thinking'] },
      { title: 'The CIA Triad in Real Decisions', level: 'Beginner', specialization: 'foundations', concepts: ['confidentiality', 'integrity', 'availability', 'security trade-offs'] },
      { title: 'Assets, Threats, Vulnerabilities, and Risk', level: 'Beginner', specialization: 'foundations', concepts: ['assets', 'threats', 'vulnerabilities', 'risk'] },
      { title: 'Controls, Safeguards, and Defense in Depth', level: 'Beginner', specialization: 'foundations', concepts: ['preventive controls', 'detective controls', 'corrective controls', 'defense in depth'] },
      { title: 'Common Attack Surfaces Without Offensive Practice', level: 'Beginner', specialization: 'foundations', concepts: ['attack surface', 'exposure', 'misconfiguration', 'safe analysis'] },
      { title: 'Security Roles and Career Map', level: 'Beginner', specialization: 'career', concepts: ['SOC analyst', 'security engineer', 'AppSec', 'GRC'] },
      { title: 'Ethics, Legal Boundaries, and Responsible Disclosure', level: 'Beginner', specialization: 'professional', concepts: ['ethics', 'permission', 'responsible disclosure', 'documentation'] },
      { title: 'Security Vocabulary That Beginners Must Master', level: 'Beginner', specialization: 'foundations', concepts: ['risk language', 'incident language', 'identity terms', 'network terms'] },
      { title: 'How to Read a Security Scenario', level: 'Beginner', specialization: 'foundations', concepts: ['scenario parsing', 'signal vs noise', 'evidence', 'decision points'] },
      { title: 'Building Your First Security Study System', level: 'Beginner', specialization: 'learning science', concepts: ['mistake log', 'spaced review', 'deliberate practice', 'portfolio evidence'] }
    ]
  },
  {
    phase: 2,
    phaseTitle: 'Computer and Operating System Basics',
    specialization: 'systems',
    lessons: [
      { title: 'Hardware, Software, Memory, and Storage', level: 'Beginner', specialization: 'systems', concepts: ['CPU', 'memory', 'storage', 'software'] },
      { title: 'Processes, Services, and Startup Behavior', level: 'Beginner', specialization: 'systems', concepts: ['processes', 'services', 'startup items', 'system behavior'] },
      { title: 'Filesystems, Paths, and Permissions', level: 'Beginner', specialization: 'systems', concepts: ['filesystems', 'paths', 'permissions', 'ownership'] },
      { title: 'Users, Groups, and Privilege Boundaries', level: 'Beginner', specialization: 'systems', concepts: ['users', 'groups', 'privileges', 'least privilege'] },
      { title: 'Windows Security Basics', level: 'Beginner', specialization: 'systems', concepts: ['Windows accounts', 'Event Viewer', 'Defender', 'updates'] },
      { title: 'Linux Security Basics', level: 'Beginner', specialization: 'systems', concepts: ['Linux users', 'sudo', 'system logs', 'packages'] },
      { title: 'System Logs for Beginners', level: 'Beginner', specialization: 'blue team', concepts: ['logs', 'timestamps', 'event IDs', 'audit trail'] },
      { title: 'Backups, Recovery, and Resilience', level: 'Beginner', specialization: 'systems', concepts: ['backups', 'restore testing', 'recovery objectives', 'resilience'] },
      { title: 'Endpoint Hygiene and Patch Discipline', level: 'Beginner', specialization: 'blue team', concepts: ['patching', 'endpoint hygiene', 'software inventory', 'risk reduction'] },
      { title: 'Reading System Evidence Without Panic', level: 'Intermediate', specialization: 'blue team', concepts: ['evidence collection', 'baseline', 'anomaly', 'triage'] }
    ]
  },
  {
    phase: 3,
    phaseTitle: 'Networking for Cybersecurity',
    specialization: 'networking',
    lessons: [
      { title: 'IP Addresses, Subnets, and Private Networks', level: 'Beginner', specialization: 'networking', concepts: ['IP address', 'subnet', 'private network', 'routing'] },
      { title: 'TCP, UDP, Ports, and Services', level: 'Beginner', specialization: 'networking', concepts: ['TCP', 'UDP', 'ports', 'services'] },
      { title: 'DNS and Domain Investigation Basics', level: 'Beginner', specialization: 'networking', concepts: ['DNS', 'domain', 'resolver', 'record types'] },
      { title: 'HTTP, HTTPS, and Request Flow', level: 'Beginner', specialization: 'web', concepts: ['HTTP', 'HTTPS', 'requests', 'responses'] },
      { title: 'TLS, Certificates, and Trust Chains', level: 'Intermediate', specialization: 'networking', concepts: ['TLS', 'certificates', 'trust chain', 'expiration'] },
      { title: 'Firewalls, Proxies, and Network Segmentation', level: 'Intermediate', specialization: 'networking', concepts: ['firewall', 'proxy', 'segmentation', 'allowlist'] },
      { title: 'VPNs and Secure Remote Access', level: 'Intermediate', specialization: 'networking', concepts: ['VPN', 'remote access', 'tunneling', 'authentication'] },
      { title: 'Network Diagrams and Data Flow Thinking', level: 'Intermediate', specialization: 'networking', concepts: ['network diagram', 'data flow', 'trust boundary', 'dependency'] },
      { title: 'Reading Network Logs and Flow Records', level: 'Intermediate', specialization: 'blue team', concepts: ['flow logs', 'source IP', 'destination IP', 'port patterns'] },
      { title: 'Network Risk Review Mini-Method', level: 'Intermediate', specialization: 'networking', concepts: ['exposure review', 'critical service', 'asset priority', 'mitigation'] }
    ]
  },
  {
    phase: 4,
    phaseTitle: 'Linux and Command Line Workflow',
    specialization: 'linux',
    lessons: [
      { title: 'Command Line Orientation', level: 'Beginner', specialization: 'linux', concepts: ['shell', 'prompt', 'arguments', 'working directory'] },
      { title: 'Navigating Files and Directories', level: 'Beginner', specialization: 'linux', concepts: ['pwd', 'ls', 'cd', 'paths'] },
      { title: 'Reading, Searching, and Filtering Text', level: 'Beginner', specialization: 'linux', concepts: ['cat', 'less', 'grep', 'pipes'] },
      { title: 'Permissions with chmod, chown, and sudo', level: 'Intermediate', specialization: 'linux', concepts: ['chmod', 'chown', 'sudo', 'permission risk'] },
      { title: 'Processes and System Resource Review', level: 'Intermediate', specialization: 'linux', concepts: ['ps', 'top', 'process owner', 'resource usage'] },
      { title: 'Linux Logs and Journal Review', level: 'Intermediate', specialization: 'blue team', concepts: ['journalctl', 'auth logs', 'timestamps', 'event context'] },
      { title: 'Package Management and Update Safety', level: 'Beginner', specialization: 'linux', concepts: ['package manager', 'repositories', 'updates', 'rollback'] },
      { title: 'Environment Variables and Secrets Risk', level: 'Intermediate', specialization: 'linux', concepts: ['environment variables', 'secrets', 'process exposure', 'configuration'] },
      { title: 'Safe Bash Automation for Defenders', level: 'Intermediate', specialization: 'security engineering', concepts: ['bash scripts', 'idempotence', 'logging', 'safe defaults'] },
      { title: 'Command Line Evidence Collection Checklist', level: 'Intermediate', specialization: 'blue team', concepts: ['evidence collection', 'chain of notes', 'minimal change', 'repeatability'] }
    ]
  },
  {
    phase: 5,
    phaseTitle: 'Web and Application Security Defense',
    specialization: 'appsec',
    lessons: [
      { title: 'How Web Applications Work', level: 'Beginner', specialization: 'appsec', concepts: ['browser', 'server', 'state', 'API'] },
      { title: 'Sessions, Cookies, and Tokens', level: 'Intermediate', specialization: 'appsec', concepts: ['session', 'cookie', 'token', 'expiration'] },
      { title: 'Authentication Flows and Failure Modes', level: 'Intermediate', specialization: 'appsec', concepts: ['login flow', 'password reset', 'MFA', 'account recovery'] },
      { title: 'Authorization and Broken Access Control', level: 'Intermediate', specialization: 'appsec', concepts: ['authorization', 'role check', 'object ownership', 'access control'] },
      { title: 'Input Validation and Injection Prevention', level: 'Intermediate', specialization: 'appsec', concepts: ['input validation', 'parameterization', 'escaping', 'server-side checks'] },
      { title: 'Security Headers and Browser Protections', level: 'Intermediate', specialization: 'appsec', concepts: ['CSP', 'HSTS', 'X-Frame-Options', 'secure cookies'] },
      { title: 'Secrets Handling in Web Apps', level: 'Intermediate', specialization: 'appsec', concepts: ['API keys', 'environment variables', 'secret rotation', 'least exposure'] },
      { title: 'Logging and Monitoring for Web Apps', level: 'Intermediate', specialization: 'appsec', concepts: ['request logs', 'error logs', 'audit logs', 'alerting'] },
      { title: 'Secure Code Review for Beginners', level: 'Advanced', specialization: 'appsec', concepts: ['code review', 'trust boundary', 'dangerous assumption', 'fix guidance'] },
      { title: 'Writing Developer-Friendly Security Findings', level: 'Advanced', specialization: 'appsec', concepts: ['impact', 'reproduction safely', 'remediation', 'verification'] }
    ]
  },
  {
    phase: 6,
    phaseTitle: 'Blue Team and SOC Operations',
    specialization: 'soc',
    lessons: [
      { title: 'SOC Workflow and Alert Triage', level: 'Beginner', specialization: 'soc', concepts: ['SOC workflow', 'alert', 'triage', 'escalation'] },
      { title: 'Severity, Priority, and Business Impact', level: 'Beginner', specialization: 'soc', concepts: ['severity', 'priority', 'impact', 'urgency'] },
      { title: 'Phishing Analysis and Safe Verification', level: 'Beginner', specialization: 'soc', concepts: ['phishing indicators', 'headers', 'links', 'verification'] },
      { title: 'Login Anomaly Investigation', level: 'Intermediate', specialization: 'soc', concepts: ['failed login', 'impossible travel', 'MFA fatigue', 'baseline'] },
      { title: 'Endpoint Alert Triage', level: 'Intermediate', specialization: 'soc', concepts: ['endpoint alert', 'parent process', 'command line', 'containment'] },
      { title: 'SIEM Search Thinking', level: 'Intermediate', specialization: 'soc', concepts: ['SIEM', 'query logic', 'time range', 'field filtering'] },
      { title: 'Incident Response Lifecycle', level: 'Intermediate', specialization: 'incident response', concepts: ['preparation', 'detection', 'containment', 'lessons learned'] },
      { title: 'Writing Clean Incident Notes', level: 'Intermediate', specialization: 'incident response', concepts: ['timeline', 'evidence', 'hypothesis', 'next step'] },
      { title: 'False Positives and Tuning', level: 'Advanced', specialization: 'soc', concepts: ['false positive', 'tuning', 'signal quality', 'detection logic'] },
      { title: 'SOC Portfolio Simulation', level: 'Advanced', specialization: 'soc', concepts: ['case summary', 'evidence pack', 'triage decision', 'portfolio artifact'] }
    ]
  },
  {
    phase: 7,
    phaseTitle: 'Identity, Cryptography, and Cloud Security',
    specialization: 'cloud security',
    lessons: [
      { title: 'Authentication vs Authorization Deep Dive', level: 'Beginner', specialization: 'iam', concepts: ['authentication', 'authorization', 'identity provider', 'permission'] },
      { title: 'Least Privilege and Role Design', level: 'Intermediate', specialization: 'iam', concepts: ['least privilege', 'role design', 'permission scope', 'review cadence'] },
      { title: 'IAM Review and Access Recertification', level: 'Intermediate', specialization: 'iam', concepts: ['access review', 'recertification', 'owner approval', 'stale access'] },
      { title: 'Hashing, Encryption, and Encoding', level: 'Intermediate', specialization: 'cryptography', concepts: ['hashing', 'encryption', 'encoding', 'integrity'] },
      { title: 'Keys, Certificates, and Rotation', level: 'Intermediate', specialization: 'cryptography', concepts: ['keys', 'certificates', 'rotation', 'expiration'] },
      { title: 'Cloud Shared Responsibility', level: 'Beginner', specialization: 'cloud security', concepts: ['shared responsibility', 'cloud provider', 'customer responsibility', 'configuration'] },
      { title: 'Cloud IAM and Permission Boundaries', level: 'Intermediate', specialization: 'cloud security', concepts: ['cloud IAM', 'permission boundary', 'resource policy', 'blast radius'] },
      { title: 'Secrets Management in Cloud Systems', level: 'Intermediate', specialization: 'cloud security', concepts: ['secrets manager', 'rotation', 'audit trail', 'exposure'] },
      { title: 'Container Security Basics', level: 'Advanced', specialization: 'cloud security', concepts: ['container image', 'runtime', 'registry', 'least privilege'] },
      { title: 'Cloud Misconfiguration Review', level: 'Advanced', specialization: 'cloud security', concepts: ['misconfiguration', 'public exposure', 'logging gaps', 'remediation'] }
    ]
  },
  {
    phase: 8,
    phaseTitle: 'Secure Coding and DevSecOps',
    specialization: 'secure coding',
    lessons: [
      { title: 'Secure Development Lifecycle Basics', level: 'Beginner', specialization: 'devsecops', concepts: ['SDLC', 'security requirements', 'review gates', 'feedback loop'] },
      { title: 'Threat Modeling for Small Features', level: 'Intermediate', specialization: 'devsecops', concepts: ['threat model', 'data flow', 'trust boundary', 'abuse case'] },
      { title: 'Dependency Risk and Software Supply Chain', level: 'Intermediate', specialization: 'devsecops', concepts: ['dependency', 'package risk', 'lockfile', 'update policy'] },
      { title: 'Static Analysis and Finding Triage', level: 'Intermediate', specialization: 'devsecops', concepts: ['SAST', 'finding triage', 'false positive', 'severity'] },
      { title: 'Secrets Detection and Safe Remediation', level: 'Intermediate', specialization: 'devsecops', concepts: ['secret scanning', 'revocation', 'rotation', 'history cleanup'] },
      { title: 'Secure API Design Basics', level: 'Intermediate', specialization: 'appsec', concepts: ['API auth', 'rate limits', 'input contracts', 'error handling'] },
      { title: 'Logging Without Leaking Sensitive Data', level: 'Intermediate', specialization: 'appsec', concepts: ['safe logging', 'PII', 'redaction', 'audit trail'] },
      { title: 'CI/CD Security Basics', level: 'Advanced', specialization: 'devsecops', concepts: ['CI/CD', 'workflow permissions', 'secrets', 'artifact integrity'] },
      { title: 'Security Regression Testing', level: 'Advanced', specialization: 'devsecops', concepts: ['regression test', 'abuse case test', 'unit test', 'integration test'] },
      { title: 'Developer Security Communication', level: 'Intermediate', specialization: 'devsecops', concepts: ['clear finding', 'fix priority', 'developer empathy', 'verification'] }
    ]
  },
  {
    phase: 9,
    phaseTitle: 'AI Security and Privacy Awareness',
    specialization: 'ai security',
    lessons: [
      { title: 'AI Security Basics for Learners', level: 'Beginner', specialization: 'ai security', concepts: ['AI system', 'model behavior', 'data boundary', 'risk'] },
      { title: 'Prompt Injection and Instruction Conflicts', level: 'Intermediate', specialization: 'ai security', concepts: ['prompt injection', 'instruction hierarchy', 'untrusted input', 'output validation'] },
      { title: 'Data Leakage and Privacy in AI Tools', level: 'Beginner', specialization: 'privacy', concepts: ['data leakage', 'PII', 'confidentiality', 'privacy review'] },
      { title: 'AI Tool Use Policy for Students and Teams', level: 'Beginner', specialization: 'policy', concepts: ['tool policy', 'allowed data', 'review process', 'accountability'] },
      { title: 'Model Output Verification', level: 'Intermediate', specialization: 'ai security', concepts: ['verification', 'hallucination', 'source checking', 'human review'] },
      { title: 'AI-Assisted Coding Risk', level: 'Intermediate', specialization: 'secure coding', concepts: ['generated code', 'dependency risk', 'unsafe pattern', 'code review'] },
      { title: 'AI in SOC Workflows', level: 'Intermediate', specialization: 'soc', concepts: ['alert summary', 'analyst assist', 'false confidence', 'human decision'] },
      { title: 'Building Safe Educational AI Tutors', level: 'Advanced', specialization: 'ai security', concepts: ['safety boundary', 'retrieval', 'guardrail', 'review queue'] },
      { title: 'AI Abuse Prevention Basics', level: 'Intermediate', specialization: 'ai security', concepts: ['misuse prevention', 'rate limit', 'policy enforcement', 'monitoring'] },
      { title: 'AI Security Portfolio Project Planning', level: 'Advanced', specialization: 'ai security', concepts: ['portfolio project', 'risk memo', 'safe demo', 'evaluation'] }
    ]
  },
  {
    phase: 10,
    phaseTitle: 'Professional Skills and Portfolio',
    specialization: 'professional',
    lessons: [
      { title: 'Security Writing That Sounds Professional', level: 'Beginner', specialization: 'professional', concepts: ['clarity', 'evidence', 'impact', 'recommendation'] },
      { title: 'Risk Register Basics', level: 'Beginner', specialization: 'grc', concepts: ['risk register', 'likelihood', 'impact', 'owner'] },
      { title: 'Business Continuity and Disaster Recovery', level: 'Intermediate', specialization: 'grc', concepts: ['business continuity', 'disaster recovery', 'RTO', 'RPO'] },
      { title: 'Privacy and Data Classification Basics', level: 'Intermediate', specialization: 'privacy', concepts: ['data classification', 'PII', 'retention', 'access need'] },
      { title: 'Portfolio Artifact Quality Bar', level: 'Beginner', specialization: 'career', concepts: ['portfolio artifact', 'scope', 'evidence', 'reflection'] },
      { title: 'Cybersecurity Resume for Beginners', level: 'Beginner', specialization: 'career', concepts: ['resume', 'skills evidence', 'projects', 'keywords'] },
      { title: 'Interview Storytelling with STAR', level: 'Beginner', specialization: 'career', concepts: ['STAR method', 'situation', 'action', 'result'] },
      { title: 'Learning Plan for the Next 90 Days', level: 'Beginner', specialization: 'learning science', concepts: ['90-day plan', 'milestones', 'review cadence', 'accountability'] },
      { title: 'Capstone Presentation and Demo Safety', level: 'Intermediate', specialization: 'career', concepts: ['capstone', 'demo safety', 'scope control', 'communication'] },
      { title: 'From Beginner to Specialization Readiness', level: 'Intermediate', specialization: 'career', concepts: ['readiness', 'gap analysis', 'role path', 'next evidence'] }
    ]
  }
];

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildLessonContent(lesson: CurriculumLesson, module: CurriculumModule) {
  const [a, b, c, d] = lesson.concepts;
  return [
    `${lesson.title} is part of the ${module.phaseTitle} path. The goal is not to memorize cyber vocabulary; the goal is to make safer decisions with clear evidence.`,
    `Start with ${a}. A strong learner can define it, recognize it in a scenario, and explain why it changes the defensive decision.`,
    `Then connect it to ${b} and ${c}. In real work, these ideas usually appear together, so the student must compare them instead of treating each term as isolated trivia.`,
    `The professional move is to document what you know, what you infer, what you still need to verify, and which action reduces risk without creating new harm.`,
    `This lesson is defensive-only. Use fictional data, authorized practice, and toy examples. Never turn learning into live-target activity.`
  ].join('\n\n');
}

function lessonObjectives(lesson: CurriculumLesson) {
  const [a, b, c, d] = lesson.concepts;
  return [
    `Define ${a} in plain language.`,
    `Explain how ${b} changes a defensive decision.`,
    `Recognize a common mistake involving ${c}.`,
    `Use ${d} to write a safer next step.`
  ];
}

function lessonExamples(lesson: CurriculumLesson) {
  const [a, b, c] = lesson.concepts;
  return [
    `Scenario: A learner sees ${a} in a fictional company note and identifies the key risk without exaggerating.`,
    `Scenario: A team compares ${b} and ${c} before choosing the lowest-risk action.`,
    `Scenario: A mentor asks the learner to explain the decision in one paragraph using evidence, impact, and next step.`
  ];
}

function lessonChecks(lesson: CurriculumLesson) {
  const [a, b, c, d] = lesson.concepts;
  return [
    `What does ${a} mean in this lesson?`,
    `What evidence would help you evaluate ${b}?`,
    `What mistake do beginners make with ${c}?`,
    `How does ${d} help reduce risk?`
  ];
}

function upsertLesson(module: CurriculumModule, lesson: CurriculumLesson, orderIndex: number) {
  const now = nowIso();
  const slug = slugify(lesson.title);
  const existing = one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE slug = ?', slug);
  const id = existing ? String(existing.id) : makeId();
  const content = buildLessonContent(lesson, module);

  run(
    `INSERT INTO lessons (id, slug, title, phase, phase_title, level, order_index, specialization, estimated_minutes, learning_objectives, content, glossary, examples, knowledge_checks, common_mistakes, why_it_matters, icon, version, last_reviewed_at, review_due_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'shield', 1, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       title = excluded.title,
       phase = excluded.phase,
       phase_title = excluded.phase_title,
       level = excluded.level,
       order_index = excluded.order_index,
       specialization = excluded.specialization,
       estimated_minutes = excluded.estimated_minutes,
       learning_objectives = excluded.learning_objectives,
       content = excluded.content,
       glossary = excluded.glossary,
       examples = excluded.examples,
       knowledge_checks = excluded.knowledge_checks,
       common_mistakes = excluded.common_mistakes,
       why_it_matters = excluded.why_it_matters,
       updated_at = excluded.updated_at`,
    id,
    slug,
    lesson.title,
    module.phase,
    module.phaseTitle,
    lesson.level,
    orderIndex,
    lesson.specialization,
    lesson.level === 'Advanced' ? 35 : lesson.level === 'Intermediate' ? 28 : 22,
    toDbJson(lessonObjectives(lesson)),
    content,
    toDbJson(lesson.concepts.map((term) => ({ term, definition: `${term} explained through defensive, authorized cybersecurity practice.` }))),
    toDbJson(lessonExamples(lesson)),
    toDbJson(lessonChecks(lesson)),
    `A common mistake is treating ${lesson.concepts[0]} as a memorized term instead of using it to make a clearer defensive decision. Another mistake is overclaiming without enough evidence.`,
    `${lesson.title} matters because professional security work rewards careful judgment, clean communication, and safe risk reduction more than flashy terminology.`,
    now,
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    now,
    now
  );

  const row = one<Record<string, unknown>>('SELECT id FROM lessons WHERE slug = ?', slug);
  return { id: String(row.id), slug };
}

function seedQuestions(lessonId: string, lesson: CurriculumLesson, module: CurriculumModule) {
  run("DELETE FROM quiz_questions WHERE lesson_id = ? AND prompt LIKE '[Phase 1 Expansion]%'", lessonId);
  const now = nowIso();
  const [a, b, c, d] = lesson.concepts;
  const questions = [
    {
      prompt: `[Phase 1 Expansion] Which choice best defines ${a} in ${lesson.title}?`,
      type: 'multiple-choice',
      topic: module.phaseTitle,
      subtopic: a,
      explanation: `${a} is the direct concept being tested. The correct answer uses precise defensive language instead of vague cyber-sounding words.`,
      options: [
        { id: 'a', label: `A defensive concept connected to ${a}` },
        { id: 'b', label: 'An unrelated tool name' },
        { id: 'c', label: 'A dramatic claim without evidence' },
        { id: 'd', label: 'A live-target action' }
      ],
      answer: 'a'
    },
    {
      prompt: `[Phase 1 Expansion] What should a learner do before making a decision about ${b}?`,
      type: 'multiple-choice',
      topic: module.phaseTitle,
      subtopic: b,
      explanation: 'Professional security decisions should be based on evidence and authorized scope.',
      options: [
        { id: 'a', label: 'Collect relevant evidence and confirm the authorized scope' },
        { id: 'b', label: 'Guess quickly because speed matters more than accuracy' },
        { id: 'c', label: 'Ignore documentation until the end' },
        { id: 'd', label: 'Move directly to real systems without permission' }
      ],
      answer: 'a'
    },
    {
      prompt: `[Phase 1 Expansion] Select the answers that show safe defensive practice for ${lesson.title}.`,
      type: 'multi-select',
      topic: module.phaseTitle,
      subtopic: c,
      explanation: 'The safe choices emphasize authorization, evidence, and documentation.',
      options: [
        { id: 'a', label: 'Use fictional or authorized environments' },
        { id: 'b', label: 'Document evidence clearly' },
        { id: 'c', label: 'Skip permission if the goal is learning' },
        { id: 'd', label: 'Overclaim impact before verifying facts' }
      ],
      answer: ['a', 'b']
    },
    {
      prompt: `[Phase 1 Expansion] True or false: ${c} should be evaluated with context, not memorized as empty vocabulary.`,
      type: 'true-false',
      topic: module.phaseTitle,
      subtopic: c,
      explanation: 'True. Terms become useful only when they improve decisions in context.',
      options: [],
      answer: true
    },
    {
      prompt: `[Phase 1 Expansion] True or false: ${d} is useful only if it helps reduce risk safely and legally.`,
      type: 'true-false',
      topic: module.phaseTitle,
      subtopic: d,
      explanation: 'True. The platform is defensive-only and must keep learners inside authorized boundaries.',
      options: [],
      answer: true
    }
  ];

  for (const question of questions) {
    run(
      `INSERT INTO quiz_questions (id, lesson_id, prompt, type, difficulty, topic, subtopic, explanation, scenario_context, options, answer, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      makeId(),
      lessonId,
      question.prompt,
      question.type,
      lesson.level,
      question.topic,
      question.subtopic,
      question.explanation,
      toDbJson(question.options),
      toDbJson(question.answer),
      now
    );
  }
}

const labScenarios = [
  'Phishing email triage', 'Suspicious login review', 'Endpoint alert triage', 'Access review', 'Password policy audit',
  'Network flow review', 'DNS anomaly review', 'Cloud IAM review', 'Secrets exposure review', 'Secure header review',
  'Toy code access-control review', 'Error log review', 'Backup readiness review', 'Risk register update', 'Privacy data classification',
  'Incident timeline writing', 'False positive tuning', 'Firewall rule review', 'Dependency risk review', 'CI workflow permission review',
  'AI tool data leakage review', 'Prompt injection risk memo', 'Container configuration review', 'MFA fatigue triage', 'Executive incident summary'
];

function seedLabs() {
  const now = nowIso();
  labScenarios.forEach((title, index) => {
    const slug = `phase1-${slugify(title)}`;
    run(
      `INSERT INTO labs (id, slug, title, category, difficulty, description, dataset, tasks, safe_guardrails, solution_outline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         category = excluded.category,
         difficulty = excluded.difficulty,
         description = excluded.description,
         dataset = excluded.dataset,
         tasks = excluded.tasks,
         safe_guardrails = excluded.safe_guardrails,
         solution_outline = excluded.solution_outline`,
      makeId(),
      slug,
      `[Phase 1] ${title}`,
      index < 5 ? 'Beginner defensive lab' : index < 18 ? 'Intermediate defensive lab' : 'Advanced defensive lab',
      index < 8 ? 'Beginner' : index < 20 ? 'Intermediate' : 'Advanced',
      `Use a fictional scenario to practice ${title.toLowerCase()} with evidence, safe scope, and professional documentation.`,
      toDbJson({ source: 'fictional-training-dataset', scenario: title, events: [`${title} event A`, `${title} event B`, `${title} event C`] }),
      toDbJson([
        { id: 'scope', prompt: 'Confirm the safe scope and what evidence you are allowed to use.', expectedKeywords: ['fictional', 'authorized', 'evidence', 'scope'] },
        { id: 'triage', prompt: 'Identify the highest-value signal and explain why it matters.', expectedKeywords: ['signal', 'risk', 'impact', 'evidence'] },
        { id: 'next-step', prompt: 'Write one safe next step that reduces risk without overclaiming.', expectedKeywords: ['document', 'verify', 'reduce', 'risk'] }
      ]),
      'This is a fictional, defensive-only exercise. Do not test live systems or real users.',
      'A strong answer confirms scope, separates evidence from inference, identifies the main risk signal, and recommends a safe next step.'
    );
  });
  console.log(`Seeded ${labScenarios.length} Phase 1 labs at ${now}.`);
}

const glossaryCategories = [
  ['Foundations', ['asset', 'threat', 'vulnerability', 'risk', 'control', 'safeguard', 'exposure', 'impact', 'likelihood', 'scope']],
  ['Identity', ['authentication', 'authorization', 'identity provider', 'role', 'permission', 'least privilege', 'MFA', 'session', 'token', 'access review']],
  ['Networking', ['IP address', 'subnet', 'TCP', 'UDP', 'port', 'DNS', 'HTTP', 'TLS', 'proxy', 'firewall']],
  ['Linux', ['shell', 'working directory', 'file permission', 'sudo', 'process', 'service', 'journal', 'package manager', 'environment variable', 'script']],
  ['Web', ['cookie', 'API', 'request', 'response', 'CSP', 'HSTS', 'input validation', 'server-side check', 'rate limit', 'error handling']],
  ['Blue Team', ['alert', 'triage', 'SIEM', 'EDR', 'false positive', 'severity', 'priority', 'incident', 'timeline', 'escalation']],
  ['Cloud', ['shared responsibility', 'cloud IAM', 'bucket', 'security group', 'secret manager', 'container', 'registry', 'resource policy', 'blast radius', 'configuration drift']],
  ['Secure Coding', ['dependency', 'lockfile', 'SAST', 'secret scanning', 'CI/CD', 'artifact', 'regression test', 'abuse case', 'trust boundary', 'fix verification']],
  ['AI Security', ['prompt injection', 'untrusted input', 'model output', 'data leakage', 'hallucination', 'retrieval', 'guardrail', 'human review', 'policy enforcement', 'misuse prevention']],
  ['Privacy', ['PII', 'data classification', 'retention', 'consent', 'minimization', 'redaction', 'access need', 'privacy review', 'sensitive data', 'data boundary']],
  ['GRC', ['risk register', 'control owner', 'policy', 'standard', 'procedure', 'audit evidence', 'exception', 'business continuity', 'RTO', 'RPO']],
  ['Professional', ['finding', 'recommendation', 'executive summary', 'evidence pack', 'STAR method', 'portfolio artifact', 'scope statement', 'impact statement', 'remediation plan', 'lessons learned']],
  ['Monitoring', ['health check', 'readiness check', 'request ID', 'structured log', 'metric', 'trace', 'uptime check', 'error event', 'alert threshold', 'dashboard']],
  ['Payments and Ops', ['hosted checkout', 'webhook', 'subscription status', 'trialing', 'active plan', 'past due', 'invoice', 'receipt email', 'provider token', 'audit log']],
  ['Safety', ['authorized lab', 'toy dataset', 'fictional scenario', 'defensive-only', 'safe remediation', 'harm boundary', 'responsible practice', 'mentor review', 'content guardrail', 'unsafe request']]
] as const;

function seedGlossary() {
  for (const [category, terms] of glossaryCategories) {
    for (const term of terms) {
      run(
        `INSERT INTO glossary_terms (id, term, definition, category)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(term) DO UPDATE SET definition = excluded.definition, category = excluded.category`,
        makeId(),
        term,
        `${term} is a ${category.toLowerCase()} concept used in defensive cybersecurity learning. A strong learner can define it, recognize it in a scenario, and explain how it changes a safe decision.`,
        category
      );
    }
  }
}

const projectTitles = [
  ['soc-alert-triage-pack', 'SOC Alert Triage Pack', 'SOC analyst', 'Build a fictional alert investigation pack with timeline, evidence, severity, and escalation note.'],
  ['phishing-review-portfolio', 'Phishing Review Portfolio', 'SOC analyst', 'Analyze fictional emails, identify indicators, and write a safe verification workflow.'],
  ['iam-hardening-brief', 'IAM Hardening Brief', 'cloud security', 'Review a mock identity setup and reduce excessive privilege.'],
  ['web-auth-review-brief', 'Web Auth Review Brief', 'AppSec analyst', 'Review a toy web authentication flow and explain safer remediation.'],
  ['secure-code-review-notebook', 'Secure Code Review Notebook', 'AppSec analyst', 'Document beginner-friendly secure-code findings from toy snippets.'],
  ['network-risk-map', 'Network Risk Map', 'network security', 'Create a simple network diagram risk review with trust boundaries and mitigations.'],
  ['cloud-config-review', 'Cloud Configuration Review', 'cloud security', 'Review fictional cloud settings and write a prioritized remediation plan.'],
  ['ai-tool-risk-memo', 'AI Tool Risk Memo', 'AI security', 'Assess AI-tool data leakage and prompt-injection risk for a fictional team.'],
  ['risk-register-mini-project', 'Risk Register Mini Project', 'GRC analyst', 'Create a risk register for a fictional service with owner, likelihood, impact, and treatment.'],
  ['incident-executive-summary', 'Incident Executive Summary', 'incident response', 'Turn fictional incident notes into a clear executive summary and next-step plan.']
] as const;

function seedProjects() {
  const now = nowIso();
  for (const [slug, title, specialization, summary] of projectTitles) {
    run(
      `INSERT INTO guided_projects (id, slug, title, specialization, difficulty, summary, estimated_hours, checkpoints_json, rubric_json, starter_lesson_slug, created_at)
       VALUES (?, ?, ?, ?, 'Intermediate', ?, 6, ?, ?, NULL, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         specialization = excluded.specialization,
         difficulty = excluded.difficulty,
         summary = excluded.summary,
         estimated_hours = excluded.estimated_hours,
         checkpoints_json = excluded.checkpoints_json,
         rubric_json = excluded.rubric_json`,
      makeId(),
      slug,
      title,
      specialization,
      summary,
      toDbJson(['Define scope', 'Collect fictional evidence', 'Analyze risk', 'Write recommendation', 'Reflect on limits']),
      toDbJson(['Uses safe fictional scope', 'Separates evidence from inference', 'Explains business/security impact', 'Gives realistic remediation', 'Communicates clearly']),
      now
    );
  }
}

function main() {
  initDb();
  let lessonCount = 0;
  let questionCount = 0;

  for (const module of modules) {
    module.lessons.forEach((lesson, index) => {
      const { id } = upsertLesson(module, lesson, index + 1);
      seedQuestions(id, lesson, module);
      lessonCount += 1;
      questionCount += 5;
    });
  }

  seedLabs();
  seedGlossary();
  seedProjects();

  console.log(`Phase 1 curriculum seeded: ${lessonCount} lessons, ${questionCount} quiz questions, ${labScenarios.length} labs, ${projectTitles.length} guided projects, ${glossaryCategories.length * 10} glossary terms.`);
}

main();
