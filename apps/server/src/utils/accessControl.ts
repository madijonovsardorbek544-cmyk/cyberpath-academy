import type { Response } from 'express';
import { many, mapSubscription, one } from '../lib/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export type PlanId = 'free' | 'premium' | 'school';
export type Entitlement =
  | 'lessons:all'
  | 'labs:all'
  | 'tutor:guided'
  | 'certificates:claim'
  | 'projects:guided'
  | 'portfolio:publish'
  | 'analytics:full'
  | 'cohorts:manage'
  | 'reports:export';

export const planCatalog = [
  {
    id: 'free' as const,
    name: 'Free',
    accessLevel: 10,
    priceMonthlyUsd: 0,
    priceMonthlyUzs: 0,
    trialDays: 0,
    description: 'Starter access for beginner learners: limited lessons, starter quizzes, starter labs, basic dashboard, and mistake notebook.',
    features: ['Limited beginner lessons', 'Starter quizzes', 'Starter defensive labs', 'Basic dashboard', 'Mistake notebook'],
    entitlements: [] as Entitlement[],
    starterLimits: { lessons: 6, labs: 2 },
    paymentMethods: [] as string[]
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    accessLevel: 100,
    priceMonthlyUsd: 3,
    priceMonthlyUzs: 36000,
    trialDays: 30,
    description: 'Full learner access: all lessons and labs, guided tutor, certificates, projects, portfolio publishing, and full analytics.',
    features: ['All lessons', 'All labs', 'Guided tutor', 'Certificates', 'Guided projects', 'Portfolio publishing', 'Full analytics'],
    entitlements: ['lessons:all', 'labs:all', 'tutor:guided', 'certificates:claim', 'projects:guided', 'portfolio:publish', 'analytics:full'] as Entitlement[],
    starterLimits: { lessons: Number.POSITIVE_INFINITY, labs: Number.POSITIVE_INFINITY },
    paymentMethods: ['Payme (Uzcard/Humo via tokenized checkout)', 'International card via Stripe Checkout']
  },
  {
    id: 'school' as const,
    name: 'School / Cohort',
    accessLevel: 200,
    priceMonthlyUsd: null,
    priceMonthlyUzs: null,
    trialDays: 30,
    description: 'Cohort access for schools, mentors, and learning centers with assignments, student reports, exports, and cohort analytics.',
    features: ['Everything in Premium', 'Cohort dashboard', 'Teacher assignment workflow', 'Student reports', 'CSV export', 'Cohort analytics'],
    entitlements: ['lessons:all', 'labs:all', 'tutor:guided', 'certificates:claim', 'projects:guided', 'portfolio:publish', 'analytics:full', 'cohorts:manage', 'reports:export'] as Entitlement[],
    starterLimits: { lessons: Number.POSITIVE_INFINITY, labs: Number.POSITIVE_INFINITY },
    paymentMethods: ['Founder-led demo invoice only until a real provider is configured']
  }
] as const;

export function isActiveSubscription(status: string) {
  return ['trialing', 'active'].includes(status);
}

export function getUserPlan(userId: string): { planId: PlanId; status: string; entitlements: Entitlement[] } {
  const row = one<Record<string, unknown> | null>('SELECT * FROM subscriptions WHERE user_id = ?', userId);
  const subscription = mapSubscription(row);
  const planId = (subscription?.planId === 'premium' || subscription?.planId === 'school') && isActiveSubscription(subscription.status)
    ? subscription.planId as PlanId
    : 'free';
  const plan = planCatalog.find((item) => item.id === planId) ?? planCatalog[0];
  return { planId, status: subscription?.status ?? 'inactive', entitlements: [...plan.entitlements] };
}

export function hasEntitlement(userId: string, entitlement: Entitlement) {
  return getUserPlan(userId).entitlements.includes(entitlement);
}

export function lockedResponse(res: Response, entitlement: Entitlement, message: string) {
  return res.status(402).json({
    message,
    locked: true,
    requiredEntitlement: entitlement,
    upgradeRequired: true,
    plans: planCatalog.map(({ id, name, description, features }) => ({ id, name, description, features }))
  });
}

export function requireEntitlement(entitlement: Entitlement, message: string) {
  return (req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (req.user?.role === 'admin') return next();
    if (!req.user?.userId || !hasEntitlement(req.user.userId, entitlement)) {
      return lockedResponse(res, entitlement, message);
    }
    return next();
  };
}

export function isStarterLesson(lessonId: string) {
  const starterRows = many<Record<string, unknown>>('SELECT id FROM lessons ORDER BY phase ASC, order_index ASC LIMIT ?', planCatalog[0].starterLimits.lessons);
  return starterRows.some((row) => String(row.id) === lessonId);
}

export function isStarterLab(labId: string) {
  const starterRows = many<Record<string, unknown>>('SELECT id FROM labs ORDER BY title ASC LIMIT ?', planCatalog[0].starterLimits.labs);
  return starterRows.some((row) => String(row.id) === labId);
}
