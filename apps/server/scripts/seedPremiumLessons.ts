import { initDb, makeId, nowIso, one, run, toDbJson } from '../src/lib/db.js';

type PremiumLesson = {
  slug: string;
  title: string;
  estimatedMinutes: number;
  objectives: string[];
  content: string;
  glossary: Array<{ term: string; definition: string }>;
  examples: string[];
  checks: string[];
  commonMistakes: string;
  whyItMatters: string;
  questions: Array<{
    prompt: string;
    type: 'multiple-choice' | 'multi-select' | 'true-false' | 'short-response';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    topic: string;
    subtopic: string;
    explanation: string;
    options: Array<{ id: string; label: string }>;
    answer: unknown;
  }>;
};

const premiumLessons: PremiumLesson[] = [
  {
    slug: 'cybersecurity-mindset-and-authorization',
    title: 'Cybersecurity Mindset and Authorization',
    estimatedMinutes: 32,
    objectives: [
      'Explain why cybersecurity learning must stay inside authorized boundaries.',
      'Separate defensive curiosity from unsafe experimentation.',
      'Use evidence-first thinking before making a security claim.',
      'Write a safe next step for a beginner security scenario.'
    ],
    content: [
      'Premium lesson: Cybersecurity starts with judgment, not tools. A beginner usually thinks security means hacking, but professional security work is mostly careful thinking: what is allowed, what evidence exists, what risk matters, and what safe action reduces that risk.',
      'Authorization is the line that separates learning from harm. You can practice in toy labs, fictional datasets, your own systems, or environments where you have explicit permission. You do not test random websites, accounts, networks, classmates, or real users. Skill without boundaries is not professionalism; it is liability.',
      'The defensive mindset asks four questions before action: What am I allowed to inspect? What evidence do I have? What is only a guess? What is the least risky next step? This protects users, protects you, and makes your work credible.',
      'Mini practice: imagine a fake company login report says one user had ten failed logins in five minutes. A weak learner says, "This is definitely an attack." A strong learner says, "This deserves review. I need source, time, user confirmation, and recent changes before deciding severity." That difference is the beginning of professional judgment.',
      'Takeaway: your first job is not to sound technical. Your first job is to be safe, precise, and evidence-driven.'
    ].join('\n\n'),
    glossary: [
      { term: 'authorization boundary', definition: 'The limit of what you are allowed to inspect, test, or change.' },
      { term: 'defensive mindset', definition: 'A way of thinking focused on reducing risk safely and legally.' },
      { term: 'evidence-first thinking', definition: 'Making claims only after separating facts from assumptions.' },
      { term: 'safe learning', definition: 'Practice using toy data, owned systems, or clearly authorized environments.' }
    ],
    examples: [
      'Weak response: "I will try this on a real site to learn." Strong response: "I will use a controlled lab or toy app."',
      'Weak claim: "This login is malicious." Strong claim: "This login pattern is suspicious and needs verification."',
      'Weak next step: "Block everything immediately." Strong next step: "Confirm scope, collect evidence, then choose a proportional response."'
    ],
    checks: [
      'What makes a learning environment authorized?',
      'Why is guessing dangerous in security work?',
      'Rewrite this claim safely: "This user is hacked."',
      'What is the least risky next step when evidence is incomplete?'
    ],
    commonMistakes: 'Beginners often confuse curiosity with permission. They also overclaim from weak evidence because dramatic conclusions feel more impressive. Professionals do the opposite: they stay in scope, document carefully, and avoid certainty until the evidence supports it.',
    whyItMatters: 'Top learners, mentors, universities, and employers care about trust. If your cybersecurity work is unsafe or sloppy, your technical skill will not save you. This lesson sets the behavioral foundation for every lab, project, and portfolio artifact in CyberPath Academy.',
    questions: [
      {
        prompt: '[Premium] Which action best shows a professional cybersecurity mindset?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'authorization boundaries',
        explanation: 'Professional work stays inside permission, uses evidence, and avoids harmful experimentation.',
        options: [
          { id: 'a', label: 'Use an authorized toy lab and document evidence before making claims' },
          { id: 'b', label: 'Try a technique on a random website to see what happens' },
          { id: 'c', label: 'Assume every strange login is confirmed compromise' },
          { id: 'd', label: 'Skip documentation because speed is always more important' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] A fake login report shows ten failed logins. What is the best first conclusion?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'evidence-first thinking',
        explanation: 'The evidence is suspicious, but it is not enough to prove compromise without more context.',
        options: [
          { id: 'a', label: 'It deserves review, but more evidence is needed before deciding severity' },
          { id: 'b', label: 'The account is definitely compromised' },
          { id: 'c', label: 'It is definitely harmless' },
          { id: 'd', label: 'The learner should test the user account directly' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] Select the safe learning environments.',
        type: 'multi-select', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'safe learning',
        explanation: 'Safe environments are controlled, owned, fictional, or explicitly authorized.',
        options: [
          { id: 'a', label: 'A fictional training lab' },
          { id: 'b', label: 'Your own local toy app' },
          { id: 'c', label: 'A random public website' },
          { id: 'd', label: 'A classroom system without permission' }
        ],
        answer: ['a', 'b']
      }
    ]
  },
  {
    slug: 'the-cia-triad-in-real-decisions',
    title: 'The CIA Triad in Real Decisions',
    estimatedMinutes: 30,
    objectives: [
      'Define confidentiality, integrity, and availability in plain language.',
      'Recognize which part of the triad is threatened in a scenario.',
      'Explain trade-offs between security goals.',
      'Use the triad to write clearer risk statements.'
    ],
    content: [
      'Premium lesson: The CIA triad is not a slogan. It is a decision tool. Confidentiality means the right people can see the data and the wrong people cannot. Integrity means the data or system stays accurate and trustworthy. Availability means the system is usable when needed.',
      'Real security work often forces trade-offs. Stronger login rules may protect confidentiality but may also frustrate users and affect availability. More monitoring may improve integrity and detection but may raise privacy concerns. Good defenders do not memorize the triad; they use it to explain what is at risk and what trade-off is being made.',
      'Example: if a student grade file is visible to every user, the main issue is confidentiality. If grades can be changed without approval, the main issue is integrity. If the school portal is offline during exam registration, the main issue is availability.',
      'Mini practice: for any scenario, ask: Who should see it? Can we trust it? Can people use it when needed? Those three questions are often enough to turn vague worry into a clear security conversation.',
      'Takeaway: when you can name the affected part of CIA, your reports become sharper and less emotional.'
    ].join('\n\n'),
    glossary: [
      { term: 'confidentiality', definition: 'Protecting information from people who should not see it.' },
      { term: 'integrity', definition: 'Keeping information accurate, complete, and trustworthy.' },
      { term: 'availability', definition: 'Keeping systems and data usable when needed.' },
      { term: 'trade-off', definition: 'A decision where improving one goal may affect another goal.' }
    ],
    examples: [
      'Confidentiality: a private file is visible to everyone.',
      'Integrity: a record can be changed without approval or tracking.',
      'Availability: a critical portal is down when users need it.'
    ],
    checks: [
      'Which CIA goal is affected when data is exposed?',
      'Which CIA goal is affected when records are silently changed?',
      'Which CIA goal is affected when a service is unreachable?',
      'Give one example of a security trade-off.'
    ],
    commonMistakes: 'Beginners often force every scenario into only one CIA category. Real incidents can affect more than one. Start with the primary issue, then mention secondary effects if the evidence supports them.',
    whyItMatters: 'The CIA triad gives beginners a professional language for risk. Instead of saying "this is bad," you can explain exactly what kind of harm may happen.',
    questions: [
      {
        prompt: '[Premium] A private report is visible to every employee. Which CIA goal is primarily affected?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'confidentiality',
        explanation: 'The main issue is unauthorized visibility, which affects confidentiality.',
        options: [
          { id: 'a', label: 'Confidentiality' },
          { id: 'b', label: 'Integrity' },
          { id: 'c', label: 'Availability' },
          { id: 'd', label: 'None of them' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] A database record can be changed without approval or logging. Which CIA goal is most directly at risk?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'integrity',
        explanation: 'The problem is trustworthiness and accuracy of data, so integrity is the best answer.',
        options: [
          { id: 'a', label: 'Availability' },
          { id: 'b', label: 'Integrity' },
          { id: 'c', label: 'Brand color' },
          { id: 'd', label: 'Screen size' }
        ],
        answer: 'b'
      },
      {
        prompt: '[Premium] True or false: a single incident can affect more than one CIA goal.',
        type: 'true-false', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'security trade-offs',
        explanation: 'True. Many real incidents affect confidentiality, integrity, and availability at the same time.',
        options: [],
        answer: true
      }
    ]
  },
  {
    slug: 'assets-threats-vulnerabilities-and-risk',
    title: 'Assets, Threats, Vulnerabilities, and Risk',
    estimatedMinutes: 34,
    objectives: [
      'Define asset, threat, vulnerability, and risk.',
      'Separate the four terms in a scenario.',
      'Explain why risk requires both likelihood and impact.',
      'Write a simple risk statement.'
    ],
    content: [
      'Premium lesson: Risk language is where beginners either become precise or stay vague. An asset is something valuable: data, systems, money, reputation, time, or trust. A threat is something that could cause harm. A vulnerability is a weakness. Risk appears when a threat can affect an asset through a vulnerability.',
      'Do not mix the terms. "Customer data" is not a threat; it is an asset. "Weak password policy" is not the asset; it is a vulnerability. "Credential stuffing" is not the vulnerability; it is a threat behavior. Clear labels create clear decisions.',
      'Risk also needs likelihood and impact. A tiny weakness on an unimportant toy system is not the same as the same weakness on a payment system. Professionals prioritize because time is limited.',
      'Mini practice risk statement: "Because admin accounts lack MFA, unauthorized login attempts could access sensitive student records, causing confidentiality and trust impact." Notice the structure: weakness, possible event, asset, impact.',
      'Takeaway: good security writing is not dramatic. It is structured.'
    ].join('\n\n'),
    glossary: [
      { term: 'asset', definition: 'Something valuable that needs protection.' },
      { term: 'threat', definition: 'A possible source or cause of harm.' },
      { term: 'vulnerability', definition: 'A weakness that could contribute to harm.' },
      { term: 'risk', definition: 'The chance and impact of harm when a threat affects an asset through a weakness.' }
    ],
    examples: [
      'Asset: student records. Threat: unauthorized login attempt. Vulnerability: no MFA. Risk: private records may be accessed.',
      'Asset: website availability. Threat: traffic spike. Vulnerability: no scaling plan. Risk: users cannot access the site.',
      'Asset: code repository. Threat: leaked token use. Vulnerability: secrets committed to source. Risk: unauthorized access to systems.'
    ],
    checks: [
      'In a school portal, what could be an asset?',
      'What is the difference between a threat and a vulnerability?',
      'Why does impact matter when prioritizing risk?',
      'Write one risk statement using because/could/causing.'
    ],
    commonMistakes: 'The common beginner mistake is using "risk," "threat," and "vulnerability" as if they mean the same thing. They do not. If your labels are sloppy, your recommendations will also be sloppy.',
    whyItMatters: 'Admissions projects, security reports, and mentor reviews all become stronger when risk language is precise. This is one of the fastest ways to sound professional without exaggerating.',
    questions: [
      {
        prompt: '[Premium] In the phrase "student records may be exposed because admin accounts lack MFA," what are student records?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'assets',
        explanation: 'Student records are the valuable item that needs protection, so they are the asset.',
        options: [
          { id: 'a', label: 'Asset' },
          { id: 'b', label: 'Threat' },
          { id: 'c', label: 'Vulnerability' },
          { id: 'd', label: 'Control' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] Which item is a vulnerability?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'vulnerabilities',
        explanation: 'A missing MFA requirement is a weakness, so it is a vulnerability.',
        options: [
          { id: 'a', label: 'Customer database' },
          { id: 'b', label: 'Missing MFA on admin accounts' },
          { id: 'c', label: 'A flood in the server room' },
          { id: 'd', label: 'Company reputation' }
        ],
        answer: 'b'
      },
      {
        prompt: '[Premium] A good risk statement should include which ideas?',
        type: 'multi-select', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'risk',
        explanation: 'Good risk statements connect weakness, possible event, asset, and impact.',
        options: [
          { id: 'a', label: 'A weakness or condition' },
          { id: 'b', label: 'A possible harmful event' },
          { id: 'c', label: 'The affected asset or impact' },
          { id: 'd', label: 'A dramatic claim with no evidence' }
        ],
        answer: ['a', 'b', 'c']
      }
    ]
  },
  {
    slug: 'controls-safeguards-and-defense-in-depth',
    title: 'Controls, Safeguards, and Defense in Depth',
    estimatedMinutes: 32,
    objectives: [
      'Define preventive, detective, and corrective controls.',
      'Explain defense in depth using a simple analogy.',
      'Match controls to risks.',
      'Avoid relying on a single security layer.'
    ],
    content: [
      'Premium lesson: A control is something you put in place to reduce risk. It does not make risk vanish; it lowers the chance or impact of a bad event. Preventive controls try to stop problems before they happen. Detective controls help you notice problems. Corrective controls help you recover or reduce damage after something goes wrong.',
      'Defense in depth means you do not bet everything on one control. A school does not protect exams only with a locked door. It may also use identity checks, limited access, cameras, backups, audit logs, and review procedures. Each layer covers weaknesses in another layer.',
      'Example: MFA is preventive because it makes unauthorized login harder. Login alerts are detective because they help notice suspicious activity. Password reset and account recovery procedures are corrective because they help restore control after an issue.',
      'Mini practice: if the risk is unauthorized admin access, one control is weak. A better answer combines least privilege, MFA, logging, alerts, and review cadence.',
      'Takeaway: strong security is layered, practical, and matched to the actual risk.'
    ].join('\n\n'),
    glossary: [
      { term: 'preventive control', definition: 'A control designed to reduce the chance of a problem happening.' },
      { term: 'detective control', definition: 'A control designed to reveal that something may have happened.' },
      { term: 'corrective control', definition: 'A control designed to recover or reduce damage after an issue.' },
      { term: 'defense in depth', definition: 'Using multiple layers of protection instead of relying on one control.' }
    ],
    examples: [
      'Preventive: MFA for admin users.',
      'Detective: alert when an admin signs in from a new location.',
      'Corrective: reset access and restore known-good configuration after a confirmed issue.'
    ],
    checks: [
      'Is logging preventive, detective, or corrective?',
      'Why is one control rarely enough?',
      'Name three layers for protecting admin accounts.',
      'What control would help recover after accidental deletion?'
    ],
    commonMistakes: 'Beginners often recommend only one control, usually MFA or a password change. That is too shallow. A professional answer combines prevention, detection, and recovery.',
    whyItMatters: 'This lesson turns security from fear into design. Once learners understand controls, they can recommend practical improvements instead of only naming problems.',
    questions: [
      {
        prompt: '[Premium] Which control is detective?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'detective controls',
        explanation: 'An alert helps notice activity, so it is detective.',
        options: [
          { id: 'a', label: 'Login alert for unusual admin sign-in' },
          { id: 'b', label: 'MFA requirement' },
          { id: 'c', label: 'Backup restore after data loss' },
          { id: 'd', label: 'A written risk definition' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] Defense in depth means:',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'defense in depth',
        explanation: 'Defense in depth uses multiple layers so one failure does not destroy the whole system.',
        options: [
          { id: 'a', label: 'Using multiple layers of controls matched to risk' },
          { id: 'b', label: 'Using only the strongest password possible' },
          { id: 'c', label: 'Ignoring detection because prevention exists' },
          { id: 'd', label: 'Buying tools before understanding the asset' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] Select all controls that could help protect admin access.',
        type: 'multi-select', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'layered controls',
        explanation: 'A strong answer uses several layers: prevention, detection, and review.',
        options: [
          { id: 'a', label: 'MFA' },
          { id: 'b', label: 'Least privilege' },
          { id: 'c', label: 'Login alerts' },
          { id: 'd', label: 'No logs because logs are annoying' }
        ],
        answer: ['a', 'b', 'c']
      }
    ]
  },
  {
    slug: 'common-attack-surfaces-without-offensive-practice',
    title: 'Common Attack Surfaces Without Offensive Practice',
    estimatedMinutes: 31,
    objectives: [
      'Define attack surface safely and defensively.',
      'Identify common exposure areas without testing live systems.',
      'Explain why reducing exposure matters.',
      'Write a safe review checklist.'
    ],
    content: [
      'Premium lesson: An attack surface is the set of places where a system can be interacted with or exposed. For defenders, this is not an invitation to attack. It is a map for review: what exists, what is reachable, what is sensitive, and what should be reduced or monitored.',
      'Common surfaces include login pages, APIs, cloud storage, admin panels, email workflows, user permissions, third-party dependencies, and public documentation. The safe learner studies these using fictional apps, owned projects, or authorized review scopes.',
      'Reducing attack surface means removing what is unnecessary, limiting who can reach sensitive areas, improving configuration, and adding monitoring. The point is not to look dangerous; the point is to make systems simpler and safer.',
      'Mini practice: a toy school portal has public login, admin dashboard, file upload, and API endpoints. A good beginner review asks: Which parts are public? Which parts need authentication? Which actions need authorization? Which events should be logged?',
      'Takeaway: attack surface thinking is defensive mapping, not offensive experimentation.'
    ].join('\n\n'),
    glossary: [
      { term: 'attack surface', definition: 'The set of exposed places where a system can be interacted with.' },
      { term: 'exposure', definition: 'A system, feature, or data path that is reachable by users or other systems.' },
      { term: 'misconfiguration', definition: 'An unsafe or unintended setting that increases risk.' },
      { term: 'safe analysis', definition: 'Reviewing risk using authorized, fictional, or owned environments only.' }
    ],
    examples: [
      'Public login page: exposed but expected, so monitor and protect it.',
      'Admin panel visible to all users: unnecessary exposure and access-control concern.',
      'Old unused API route: remove or restrict it because unused exposure creates risk.'
    ],
    checks: [
      'What is an attack surface in defensive terms?',
      'Name three common exposure areas.',
      'Why is an unused feature still risky?',
      'How can a learner study attack surfaces safely?'
    ],
    commonMistakes: 'The dangerous beginner mistake is turning attack-surface learning into live probing of systems without permission. The professional version is controlled inventory, configuration review, and safe reduction of unnecessary exposure.',
    whyItMatters: 'Attack-surface thinking helps learners become useful quickly. Even without advanced skills, a beginner can help inventory, classify, and reduce unnecessary exposure in safe environments.',
    questions: [
      {
        prompt: '[Premium] What is the safest way for a beginner to practice attack-surface thinking?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'safe analysis',
        explanation: 'Use toy, owned, or explicitly authorized environments. Do not test public systems without permission.',
        options: [
          { id: 'a', label: 'Review a fictional toy app or owned project' },
          { id: 'b', label: 'Test random websites' },
          { id: 'c', label: 'Probe classmates accounts' },
          { id: 'd', label: 'Ignore scope because learning is the goal' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] Which item is an example of attack surface?',
        type: 'multiple-choice', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'attack surface',
        explanation: 'A public login page is an exposed interaction point.',
        options: [
          { id: 'a', label: 'A public login page' },
          { id: 'b', label: 'A private thought' },
          { id: 'c', label: 'A color preference' },
          { id: 'd', label: 'A team lunch plan' }
        ],
        answer: 'a'
      },
      {
        prompt: '[Premium] True or false: reducing attack surface can include removing unused features.',
        type: 'true-false', difficulty: 'Beginner', topic: 'Cyber Foundations', subtopic: 'exposure',
        explanation: 'True. Unused exposed features can still create risk.',
        options: [],
        answer: true
      }
    ]
  }
];

function upsertPremiumLesson(lesson: PremiumLesson) {
  const existing = one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE slug = ?', lesson.slug);
  if (!existing) {
    throw new Error(`Cannot upgrade missing lesson: ${lesson.slug}`);
  }

  const now = nowIso();
  run(
    `UPDATE lessons
     SET estimated_minutes = ?,
         learning_objectives = ?,
         content = ?,
         glossary = ?,
         examples = ?,
         knowledge_checks = ?,
         common_mistakes = ?,
         why_it_matters = ?,
         version = COALESCE(version, 1) + 1,
         last_reviewed_at = ?,
         review_due_at = ?,
         updated_at = ?
     WHERE slug = ?`,
    lesson.estimatedMinutes,
    toDbJson(lesson.objectives),
    lesson.content,
    toDbJson(lesson.glossary),
    toDbJson(lesson.examples),
    toDbJson(lesson.checks),
    lesson.commonMistakes,
    lesson.whyItMatters,
    now,
    new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    now,
    lesson.slug
  );

  const row = one<Record<string, unknown>>('SELECT id FROM lessons WHERE slug = ?', lesson.slug);
  const lessonId = String(row.id);
  run("DELETE FROM quiz_questions WHERE lesson_id = ? AND prompt LIKE '[Premium]%'", lessonId);

  for (const question of lesson.questions) {
    run(
      `INSERT INTO quiz_questions (id, lesson_id, prompt, type, difficulty, topic, subtopic, explanation, scenario_context, options, answer, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      makeId(),
      lessonId,
      question.prompt,
      question.type,
      question.difficulty,
      question.topic,
      question.subtopic,
      question.explanation,
      toDbJson(question.options),
      toDbJson(question.answer),
      now
    );
  }
}

function main() {
  initDb();
  for (const lesson of premiumLessons) {
    upsertPremiumLesson(lesson);
  }
  console.log(`Premium lesson upgrade complete: ${premiumLessons.length} flagship lessons improved.`);
}

main();
