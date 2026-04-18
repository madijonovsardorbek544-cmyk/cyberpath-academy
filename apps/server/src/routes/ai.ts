import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getStudentAnalytics } from '../utils/analytics.js';
import { getStudentMastery, getStudentRecommendations } from '../utils/learningIntelligence.js';
import { many, mapLesson, mapMistake, nowIso } from '../lib/db.js';

const router = Router();

const unsafePatterns = [
  'credential theft',
  'keylogger',
  'persistence',
  'deploy malware',
  'steal password',
  'evade detection',
  'ransomware',
  'exploit live target',
  'phish real users',
  'bypass mfa'
];

router.use(requireAuth);

router.post('/tutor', async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({
    prompt: z.string().min(3).max(3000),
    mode: z.enum(['simple', 'deep']).default('simple'),
    lessonSlug: z.string().optional()
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid tutor payload.' });
  }

  const prompt = parsed.data.prompt.toLowerCase();
  if (unsafePatterns.some((pattern) => prompt.includes(pattern))) {
    return res.json({
      answer: [
        'I cannot help with offensive or harmful cyber activity.',
        'I can help you learn defensively in safe, authorized toy environments instead.',
        'Try asking for phishing identification, log analysis, secure coding review, access-control analysis, or incident triage.'
      ].join(' '),
      recommendations: ['Open a safe lab', 'Review ethics and authorization boundaries', 'Ask for defensive detection guidance']
    });
  }

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
    ...lessonRows.map((lesson) => ({
      type: 'lesson',
      title: lesson.title,
      text: `${lesson.title} ${lesson.content} ${lesson.commonMistakes} ${lesson.whyItMatters}`
    })),
    ...glossaryRows.map((term) => ({
      type: 'glossary',
      title: term.term,
      text: `${term.term} ${term.definition}`
    }))
  ];

  const matches = corpus
    .map((item) => {
      const score = prompt
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .reduce((acc, word) => acc + (item.text.toLowerCase().includes(word) ? 1 : 0), 0);
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const tone = parsed.data.mode === 'simple' ? 'Plain language:' : 'Deep explanation:';
  const weakTopicText = analytics.weakTopics.length
    ? `Your current weakest areas are ${analytics.weakTopics.map((item) => item.topic).join(', ')}.`
    : 'You do not have enough mistakes logged yet to identify weak areas confidently.';
  const weakestTrack = mastery.slice().sort((a, b) => a.score - b.score)[0];

  const answerParts = [
    tone,
    matches.length && matches[0].score > 0
      ? matches.map((match) => `${match.title}: ${match.text.slice(0, parsed.data.mode === 'simple' ? 180 : 320)}...`).join(' ')
      : 'I do not have a perfect direct match, so answer from the course structure: define the concept, identify the risk, explain the defensive control, and connect it to real work.',
    weakTopicText,
    weakestTrack ? `Your weakest mapped specialization path is ${weakestTrack.title} at ${weakestTrack.score}%.` : 'Keep collecting evidence so I can map your role readiness more accurately.',
    mistakeRows.length
      ? `Most repeated mistakes: ${mistakeRows.slice(0, 3).map((mistake) => `${mistake.subtopic} (${mistake.repeatCount})`).join(', ')}.`
      : 'Save wrong answers in the mistake notebook so I can personalize recommendations better.',
    `Response generated at ${nowIso()}.`
  ];

  return res.json({
    answer: answerParts.join(' '),
    recommendations: recommendations.map((item) => item.title)
  });
});

export default router;
