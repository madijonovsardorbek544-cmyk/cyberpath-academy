import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { createAuditLog } from '../utils/audit.js';
import { count, makeId, mapAuditLog, mapEmail, mapFeedback, mapPortfolioArtifact, mapSubscription, many, nowIso, one, run } from '../lib/db.js';
import { planCatalog } from '../utils/accessControl.js';

const router = Router();

const feedbackSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  category: z.enum(['bug', 'content', 'feature', 'billing', 'support']),
  message: z.string().trim().min(20).max(2000),
  contentType: z.enum(['lesson', 'lab', 'quiz', 'project', 'portfolio', 'onboarding']).optional(),
  contentId: z.string().min(1).max(120).optional(),
  difficultyRating: z.enum(['too_easy', 'right_level', 'too_hard']).optional(),
  usefulnessRating: z.number().int().min(1).max(5).optional(),
  confusionNote: z.string().max(1000).optional(),
  missingExplanation: z.string().max(1000).optional(),
  wouldRecommend: z.enum(['yes', 'no', 'maybe']).optional(),
  wouldPay: z.enum(['yes', 'no', 'maybe']).optional(),
  learnerGoal: z.enum(['university', 'job', 'curiosity', 'school', 'competition', 'other']).optional()
});



router.get('/plans', (_req, res) => {
  const paymentProviders = [
    env.paymeMerchantId ? 'payme' : null,
    env.stripeSecretKey ? 'stripe' : null
  ].filter(Boolean);

  res.json({
    plans: planCatalog,
    billingIntegration: {
      providers: paymentProviders,
      paymeConfigured: Boolean(env.paymeMerchantId),
      stripeConfigured: Boolean(env.stripeSecretKey),
      demoBillingEnabled: env.enableDemoBilling,
      supportEmail: env.supportEmail,
      securityNotice: 'Do not store or display raw card numbers in your codebase. Use processor-hosted, tokenized checkout only.'
    }
  });
});

router.post('/feedback', (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid feedback payload.', errors: parsed.error.flatten() });
  }

  const id = makeId();
  const now = nowIso();
  run(
    `INSERT INTO platform_feedback (id, user_id, name, email, category, message, content_type, content_id, difficulty_rating, usefulness_rating, confusion_note, missing_explanation, would_recommend, would_pay, learner_goal, status, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    id,
    parsed.data.name,
    parsed.data.email,
    parsed.data.category,
    parsed.data.message,
    parsed.data.contentType ?? null,
    parsed.data.contentId ?? null,
    parsed.data.difficultyRating ?? null,
    parsed.data.usefulnessRating ?? null,
    parsed.data.confusionNote ?? null,
    parsed.data.missingExplanation ?? null,
    parsed.data.wouldRecommend ?? null,
    parsed.data.wouldPay ?? null,
    parsed.data.learnerGoal ?? null,
    now,
    now
  );

  createAuditLog({ action: 'platform.feedback_submitted', targetType: 'platform_feedback', targetId: id, metadata: { category: parsed.data.category, email: parsed.data.email } });
  return res.status(201).json({ message: 'Feedback submitted. This is the user feedback loop you actually need for a beta.' });
});

router.get('/metrics', (req, res) => {
  const metrics = {
    users: count('SELECT COUNT(*) as value FROM users'),
    students: count("SELECT COUNT(*) as value FROM users WHERE role = 'student'"),
    lessons: count('SELECT COUNT(*) as value FROM lessons'),
    lessonsCompleted: count('SELECT COUNT(*) as value FROM lesson_progress WHERE completed = 1'),
    quizAttempts: count('SELECT COUNT(*) as value FROM quiz_attempts'),
    labsSubmitted: count('SELECT COUNT(*) as value FROM lab_submissions'),
    feedbackOpen: count("SELECT COUNT(*) as value FROM platform_feedback WHERE status = 'new'"),
    emailQueued: count("SELECT COUNT(*) as value FROM email_outbox WHERE status = 'queued'"),
    appErrors24h: count("SELECT COUNT(*) as value FROM app_error_events WHERE created_at >= datetime('now', '-1 day')"),
    trialingSubscriptions: count("SELECT COUNT(*) as value FROM subscriptions WHERE status = 'trialing'"),
    activeSubscriptions: count("SELECT COUNT(*) as value FROM subscriptions WHERE status = 'active'"),
    timestamp: new Date().toISOString(),
    requestId: req.requestId ?? null
  };
  res.json({ metrics });
});


router.get('/portfolio/public/:shareId', (req, res) => {
  const row = one<Record<string, unknown> | null>("SELECT * FROM portfolio_artifacts WHERE public_share_id = ? AND status = 'published'", req.params.shareId);
  if (!row) return res.status(404).json({ message: 'Published artifact not found.' });
  const artifact = mapPortfolioArtifact(row);
  const owner = one<Record<string, unknown> | null>('SELECT name FROM users WHERE id = ?', artifact.userId);
  return res.json({ artifact: { ...artifact, userId: undefined, ownerName: owner ? String(owner.name) : 'CyberPath learner', mentorFeedback: undefined } });
});

router.use(requireAuth);

router.get('/subscription', (req: AuthenticatedRequest, res) => {
  const row = one<Record<string, unknown> | null>('SELECT * FROM subscriptions WHERE user_id = ?', req.user!.userId);
  const subscription = mapSubscription(row) ?? {
    id: 'default-starter',
    userId: req.user!.userId,
    planId: 'free',
    status: 'inactive',
    billingCycle: 'monthly',
    currentPeriodEnd: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  const plan = planCatalog.find((item) => item.id === subscription.planId) ?? planCatalog[0];
  res.json({ subscription, plan, plans: planCatalog, demoBillingEnabled: env.enableDemoBilling });
});

router.post('/subscription/demo-checkout', (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ planId: z.enum(['free', 'premium', 'school']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid plan.' });
  }
  if (!env.enableDemoBilling) {
    return res.status(400).json({ message: 'Demo billing is disabled. Configure a real provider before launch.' });
  }

  const now = nowIso();
  const selectedPlan = planCatalog.find((item) => item.id === parsed.data.planId) ?? planCatalog[0];
  const currentPeriodEnd = new Date(Date.now() + (selectedPlan.trialDays || 30) * 24 * 60 * 60 * 1000).toISOString();
  const status = parsed.data.planId === 'free' ? 'active' : 'trialing';
  run(
    `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, current_period_end, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'monthly', ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       plan_id = excluded.plan_id,
       status = excluded.status,
       billing_cycle = excluded.billing_cycle,
       current_period_end = excluded.current_period_end,
       updated_at = excluded.updated_at`,
    makeId(),
    req.user!.userId,
    parsed.data.planId,
    status,
    currentPeriodEnd,
    now,
    now
  );

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'billing.demo_checkout', targetType: 'subscription', targetId: req.user!.userId, metadata: { planId: parsed.data.planId, status } });
  const subscription = mapSubscription(one<Record<string, unknown> | null>('SELECT * FROM subscriptions WHERE user_id = ?', req.user!.userId));
  res.json({ subscription, message: parsed.data.planId === 'free' ? 'Free plan activated.' : `${selectedPlan.name} demo trial started. Use a tokenized payment provider and signed school agreement before charging real customers.` });
});

router.get('/my-feedback', (req: AuthenticatedRequest, res) => {
  const feedback = many<Record<string, unknown>>('SELECT * FROM platform_feedback WHERE user_id = ? OR email = (SELECT email FROM users WHERE id = ?) ORDER BY created_at DESC', req.user!.userId, req.user!.userId).map(mapFeedback);
  res.json({ feedback });
});

router.post('/my-feedback', (req: AuthenticatedRequest, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid feedback payload.', errors: parsed.error.flatten() });
  }
  const id = makeId();
  const now = nowIso();
  run(
    `INSERT INTO platform_feedback (id, user_id, name, email, category, message, content_type, content_id, difficulty_rating, usefulness_rating, confusion_note, missing_explanation, would_recommend, would_pay, learner_goal, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    id,
    req.user!.userId,
    parsed.data.name,
    parsed.data.email,
    parsed.data.category,
    parsed.data.message,
    parsed.data.contentType ?? null,
    parsed.data.contentId ?? null,
    parsed.data.difficultyRating ?? null,
    parsed.data.usefulnessRating ?? null,
    parsed.data.confusionNote ?? null,
    parsed.data.missingExplanation ?? null,
    parsed.data.wouldRecommend ?? null,
    parsed.data.wouldPay ?? null,
    parsed.data.learnerGoal ?? null,
    now,
    now
  );
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'platform.feedback_submitted_authenticated', targetType: 'platform_feedback', targetId: id, metadata: { category: parsed.data.category } });
  res.status(201).json({ message: 'Feedback submitted.' });
});

router.get('/ops', (req: AuthenticatedRequest, res) => {
  if (!['admin', 'mentor'].includes(req.user!.role)) {
    return res.status(403).json({ message: 'You do not have access to operational data.' });
  }

  const feedback = many<Record<string, unknown>>('SELECT * FROM platform_feedback ORDER BY created_at DESC LIMIT 20').map(mapFeedback);
  const emails = req.user!.role === 'admin'
    ? many<Record<string, unknown>>('SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 20').map(mapEmail)
    : [];
  const auditLogs = req.user!.role === 'admin'
    ? many<Record<string, unknown>>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 30').map(mapAuditLog)
    : [];
  const recentErrors = req.user!.role === 'admin'
    ? many<Record<string, unknown>>('SELECT * FROM app_error_events ORDER BY created_at DESC LIMIT 20')
    : [];

  res.json({ feedback, emails, auditLogs, recentErrors });
});


router.get('/checkout-options', (_req, res) => {
  res.json({
    methods: [
      {
        id: 'payme',
        label: 'Payme',
        availability: env.paymeMerchantId ? 'configured' : 'needs_credentials',
        supports: ['Uzcard', 'Humo'],
        checkoutMode: 'tokenized_redirect'
      },
      {
        id: 'stripe',
        label: 'Stripe Checkout',
        availability: env.stripeSecretKey ? 'configured' : 'needs_credentials',
        supports: ['International cards'],
        checkoutMode: 'hosted_checkout'
      }
    ],
    securityNotice: 'Raw card numbers must never be stored in source code, docs, or your database.'
  });
});

router.patch('/feedback/:id/status', (req: AuthenticatedRequest, res) => {
  if (!['admin', 'mentor'].includes(req.user!.role)) {
    return res.status(403).json({ message: 'You do not have access to modify feedback.' });
  }
  const parsed = z.object({ status: z.enum(['new', 'reviewed', 'resolved']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  const existing = one<Record<string, unknown> | null>('SELECT * FROM platform_feedback WHERE id = ?', String(req.params.id));
  if (!existing) {
    return res.status(404).json({ message: 'Feedback item not found.' });
  }
  run('UPDATE platform_feedback SET status = ?, updated_at = ? WHERE id = ?', parsed.data.status, nowIso(), String(req.params.id));
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'platform.feedback_status_updated', targetType: 'platform_feedback', targetId: String(req.params.id), metadata: { status: parsed.data.status } });
  res.json({ feedback: mapFeedback(one<Record<string, unknown>>('SELECT * FROM platform_feedback WHERE id = ?', String(req.params.id))) });
});

export default router;
