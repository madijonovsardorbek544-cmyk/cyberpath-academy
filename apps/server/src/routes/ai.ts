import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getStudentAnalytics } from '../utils/analytics.js';
import { getStudentMastery, getStudentRecommendations } from '../utils/learningIntelligence.js';
import { many, mapLesson, mapMistake, nowIso } from '../lib/db.js';

const router = Router();

const unsafePatterns = [
  'offensive',
  'credential theft',
  'keylogger',
  'persistence',
  'deploy malware',
  'steal password',
  'steal passwords',
  'evade detection',
  'bypass detection',
  'ransomware',
  'exploit live target',
  'hack a real',
  'hack into',
  'phish real users',
  'bypass mfa',
  'bypass 2fa',
  'payload',
  'reverse shell',
  'exfiltrate',
  'ddos',
  'botnet'
];

const conceptGuides = [
  {
    keys: ['defense in depth', 'layered security', 'layers'],
    title: 'Defense in depth',
    direct: 'Defense in depth means protecting a system with several independent layers, so one failure does not expose everything.',
    example: 'For an account system, layers can include strong passwords, MFA, login rate limits, suspicious-login alerts, session expiration, least privilege, and audit logs.',
    why: 'Real incidents often happen because one control fails. Layered controls reduce blast radius and give defenders more chances to detect and respond.',
    practice: 'Pick one app you use and list three layers that protect the account, then identify the weakest missing layer.',
    next: 'Review MFA, rate limiting, least privilege, and audit logging.'
  },
  {
    keys: ['phishing', 'email', 'suspicious email'],
    title: 'Phishing triage',
    direct: 'Phishing triage means checking whether a message is trying to trick a user into trusting a fake identity, opening a risky attachment, or sharing sensitive information.',
    example: 'A defensive review looks at sender identity, urgency, links, attachments, mismatched domains, unusual requests, and whether the message matches normal business context.',
    why: 'Phishing is common because it attacks human trust. A good defender documents evidence instead of guessing from one suspicious sign.',
    practice: 'Write a short triage note with: suspicious sign, evidence, risk, and safe next step.',
    next: 'Open a safe phishing or email-triage lab and practice evidence-based notes.'
  },
  {
    keys: ['log', 'logs', 'login', 'triage', 'incident'],
    title: 'Log analysis and triage',
    direct: 'Log triage means deciding which event deserves attention first by using evidence such as frequency, source, user, time, and expected behavior.',
    example: 'Seven failed logins from an unknown source deserves review before a normal backup-service success from a known subnet.',
    why: 'Defenders cannot investigate everything equally. Triage helps focus on the event with the clearest risk signal.',
    practice: 'For one fictional event, write: what happened, why it is suspicious, what evidence supports that, and what safe next step follows.',
    next: 'Practice the Auth Log Spike Review lab in terminal mode.'
  },
  {
    keys: ['mfa', '2fa', 'multi factor', 'multifactor'],
    title: 'Multi-factor authentication',
    direct: 'MFA adds another proof of identity beyond a password, making account takeover harder if a password is guessed, reused, or leaked.',
    example: 'A password plus authenticator-app approval is stronger than a password alone because the attacker needs more than one secret.',
    why: 'Passwords fail often through reuse, weak choices, and leaks. MFA reduces risk but still needs user education and backup recovery planning.',
    practice: 'Compare SMS, authenticator app, and security key MFA. Rank them from weakest to strongest and explain why.',
    next: 'Review account security, recovery codes, and suspicious login alerts.'
  },
  {
    keys: ['least privilege', 'access control', 'iam', 'permission', 'permissions'],
    title: 'Least privilege and access control',
    direct: 'Least privilege means giving each user or service only the access needed for its job, no more.',
    example: 'A backup service may need read access to specific storage, but it should not automatically have admin access to every system.',
    why: 'Over-permissioned accounts increase damage when a credential is misused or a service is compromised.',
    practice: 'Choose one role and list what it must access, what it should not access, and what log would prove misuse.',
    next: 'Review IAM basics and cloud access review labs.'
  },
  {
    keys: ['xss', 'sql injection', 'injection', 'appsec', 'secure coding'],
    title: 'Application security review',
    direct: 'Application security review means finding places where user input, authentication, authorization, or data handling could create risk.',
    example: 'A safe review checks whether inputs are validated, outputs are encoded, sessions are protected, and users cannot access data outside their role.',
    why: 'Many app vulnerabilities come from trusting input or forgetting role boundaries. Defensive review catches these before launch.',
    practice: 'Pick one form in an app and list what validation, authorization, and logging it should have.',
    next: 'Review input validation, output encoding, and role-based access control.'
  },
  {
    keys: ['cybersecurity', 'cyber security', 'security basics', 'foundation'],
    title: 'Cybersecurity foundations',
    direct: 'Cybersecurity is the practice of reducing digital risk by protecting systems, accounts, data, and people from misuse, disruption, or unauthorized access.',
    example: 'A beginner-friendly security review asks: what are we protecting, who can access it, what could go wrong, and what control reduces the risk?',
    why: 'Good security is not about random tools. It is about clear thinking, evidence, risk, controls, and continuous improvement.',
    practice: 'Choose one system and write: asset, threat, vulnerability, control, and safe next step.',
    next: 'Start with digital safety, networking basics, Linux basics, and log analysis.'
  }
];

type TutorMode = 'simple' | 'deep';

type TutorSection = {
  title: string;
  body: string;
  bullets?: string[];
};

router.use(requireAuth);

function hasUnsafeIntent(prompt: string) {
  return unsafePatterns.some((pattern) => prompt.includes(pattern));
}

function findConcept(prompt: string) {
  const scored = conceptGuides
    .map((guide) => ({
      guide,
      score: guide.keys.reduce((sum, key) => sum + (prompt.includes(key) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].guide : conceptGuides[conceptGuides.length - 1];
}

function buildModeNote(mode: TutorMode) {
  if (mode === 'simple') {
    return 'I will keep this beginner-friendly: definition first, then one concrete example, then one practice step.';
  }

  return 'I will go deeper: definition, mechanism, defensive example, risk reasoning, practice task, and next review target.';
}

function buildSafeRedirect(mode: TutorMode, weakTopicText: string, recommendationTitles: string[]) {
  const sections: TutorSection[] = [
    {
      title: 'Direct answer',
      body: 'I cannot help with offensive cyber activity or instructions that could be used against real systems.'
    },
    {
      title: 'Safe way to learn it',
      body: mode === 'simple'
        ? 'I can explain the defensive meaning: what defenders look for, how they detect risk, and how to practice safely in fictional labs.'
        : 'A professional defensive path studies attacker concepts only at a high level, then focuses on detection signals, prevention controls, evidence collection, documentation, and authorized simulation.'
    },
    {
      title: 'Defensive example',
      body: 'Instead of asking how to attack a login system, ask how defenders detect repeated failed logins, suspicious source IPs, impossible travel, weak MFA coverage, or abnormal session behavior.'
    },
    {
      title: 'Practice task',
      body: 'Open a safe lab and write a triage note: what happened, what evidence supports it, what risk it creates, and what safe next step should be taken.'
    },
    {
      title: 'Next step',
      body: `${weakTopicText} Recommended next review: ${recommendationTitles[0] ?? 'Safe Labs'}.`
    }
  ];

  return {
    answer: sections.map((section) => `${section.title}: ${section.body}`).join('\n\n'),
    sections,
    recommendations: recommendationTitles.length ? recommendationTitles : ['Open a safe lab', 'Review ethics and authorization boundaries', 'Practice defensive triage'],
    safetyLevel: 'redirected' as const,
    generatedAt: nowIso()
  };
}

function buildStructuredAnswer(params: {
  prompt: string;
  mode: TutorMode;
  weakTopicText: string;
  weakestTrackText: string;
  repeatedMistakeText: string;
  recommendationTitles: string[];
}) {
  const concept = findConcept(params.prompt);
  const detail = params.mode === 'deep'
    ? 'In real work, the defender should connect the concept to assets, threats, vulnerabilities, controls, evidence, and a safe next action.'
    : 'The main goal is to understand the idea clearly and apply it safely.';

  const sections: TutorSection[] = [
    {
      title: 'Direct answer',
      body: concept.direct
    },
    {
      title: 'Simple example',
      body: concept.example
    },
    {
      title: 'Why it matters',
      body: `${concept.why} ${detail}`
    },
    {
      title: 'Practice task',
      body: concept.practice
    },
    {
      title: 'Your next step',
      body: `${concept.next} ${params.weakTopicText} ${params.weakestTrackText} ${params.repeatedMistakeText}`
    }
  ];

  if (params.mode === 'deep') {
    sections.splice(3, 0, {
      title: 'Defensive checklist',
      body: 'Use this checklist before you answer any cybersecurity scenario.',
      bullets: [
        'Identify the asset being protected.',
        'Name the suspicious signal or weakness.',
        'Separate evidence from assumptions.',
        'Choose a safe defensive next step.',
        'Document what you would verify next.'
      ]
    });
  }

  return {
    answer: sections.map((section) => {
      const bullets = section.bullets?.length ? `\n- ${section.bullets.join('\n- ')}` : '';
      return `${section.title}: ${section.body}${bullets}`;
    }).join('\n\n'),
    sections,
    recommendations: params.recommendationTitles.length ? params.recommendationTitles : [concept.title, 'Open a safe lab', 'Review your mistake notebook'],
    safetyLevel: 'safe' as const,
    generatedAt: nowIso()
  };
}

router.post('/tutor', async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({
    prompt: z.string().min(3).max(3000),
    mode: z.enum(['simple', 'deep']).default('simple'),
    lessonSlug: z.string().optional()
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid tutor payload.' });
  }

  const prompt = parsed.data.prompt.trim().toLowerCase();

  const lessonRows = many<Record<string, unknown>>('SELECT * FROM lessons ORDER BY phase ASC, order_index ASC LIMIT 20').map(mapLesson);
  const glossaryRows = many<Record<string, unknown>>('SELECT * FROM glossary_terms ORDER BY term ASC LIMIT 50').map((row) => ({
    term: String(row.term),
    definition: String(row.definition)
  }));
  const mistakeRows = many<Record<string, unknown>>('SELECT * FROM mistakes WHERE user_id = ? ORDER BY repeat_count DESC LIMIT 10', req.user!.userId).map(mapMistake);
  const [analytics, mastery, recommendations] = await Promise.all([
    getStudentAnalytics(req.user!.userId),
    getStudentMastery(req.user!.userId),
    getStudentRecommendations(req.user!.userId)
  ]);

  const corpus = [
    ...lessonRows.map((lesson) => `${lesson.title} ${lesson.content} ${lesson.commonMistakes} ${lesson.whyItMatters}`),
    ...glossaryRows.map((term) => `${term.term} ${term.definition}`)
  ].join(' ').toLowerCase();

  const hasCourseContext = prompt
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .some((word) => corpus.includes(word));

  const weakTopicText = analytics.weakTopics.length
    ? `Your current weakest areas are ${analytics.weakTopics.map((item) => item.topic).join(', ')}.`
    : 'You do not have enough mistakes logged yet to identify weak areas confidently.';
  const weakestTrack = mastery.slice().sort((a, b) => a.score - b.score)[0];
  const weakestTrackText = weakestTrack
    ? `Your weakest mapped specialization path is ${weakestTrack.title} at ${weakestTrack.score}%.`
    : 'Keep collecting evidence so I can map your role readiness more accurately.';
  const repeatedMistakeText = mistakeRows.length
    ? `Most repeated mistakes: ${mistakeRows.slice(0, 3).map((mistake) => `${mistake.subtopic} (${mistake.repeatCount})`).join(', ')}.`
    : 'Save wrong answers in the mistake notebook so I can personalize recommendations better.';
  const recommendationTitles = recommendations.map((item) => item.title).slice(0, 4);

  if (hasUnsafeIntent(prompt)) {
    return res.json(buildSafeRedirect(parsed.data.mode, weakTopicText, recommendationTitles));
  }

  const response = buildStructuredAnswer({
    prompt: hasCourseContext ? prompt : `${prompt} cybersecurity foundations`,
    mode: parsed.data.mode,
    weakTopicText,
    weakestTrackText,
    repeatedMistakeText,
    recommendationTitles
  });

  return res.json({
    ...response,
    coachNote: buildModeNote(parsed.data.mode)
  });
});

export default router;
