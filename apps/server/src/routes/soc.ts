import { Router } from 'express';
import { socSubmitSchema } from '@cyberpath/contracts';
import { findSocShift, gradeSocShift, socShifts, toPublicShift } from '@cyberpath/contracts/soc';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { fromDbJson, makeId, nowIso, one, run, toDbJson } from '../lib/db.js';

const router = Router();
router.use(requireAuth);

function shiftStats(userId: string, slug: string) {
  const row = one<{ attempts: number; best: number | null } | null>('SELECT COUNT(*) AS attempts, MAX(score) AS best FROM soc_shift_attempts WHERE user_id = ? AND shift_slug = ?', userId, slug);
  return { attempts: Number(row?.attempts ?? 0), bestScore: row?.best === null || row?.best === undefined ? null : Number(row.best) };
}

router.get('/shifts', (req: AuthenticatedRequest, res) => {
  const shifts = socShifts.map((shift) => {
    const { alerts, briefing: _briefing, ...meta } = shift;
    return { ...meta, alertCount: alerts.length, maxScore: gradeSocShift(shift, []).maxScore, ...shiftStats(req.user!.userId, meta.slug) };
  });
  return res.json({ shifts });
});

router.get('/shifts/:slug', (req: AuthenticatedRequest, res) => {
  const shift = findSocShift(String(req.params.slug));
  if (!shift) return res.status(404).json({ message: 'Shift not found.' });
  const last = one<{ result_json: string } | null>('SELECT result_json FROM soc_shift_attempts WHERE user_id = ? AND shift_slug = ? ORDER BY created_at DESC LIMIT 1', req.user!.userId, shift.slug);
  return res.json({ shift: toPublicShift(shift), ...shiftStats(req.user!.userId, shift.slug), lastResult: last ? fromDbJson(last.result_json, null) : null });
});

router.post('/shifts/:slug/submit', (req: AuthenticatedRequest, res) => {
  const shift = findSocShift(String(req.params.slug));
  if (!shift) return res.status(404).json({ message: 'Shift not found.' });
  const parsed = socSubmitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid shift submission.' });

  const ids = new Set(parsed.data.decisions.map((decision) => decision.alertId));
  if (ids.size !== parsed.data.decisions.length || shift.alerts.some((alert) => !ids.has(alert.id)) || ids.size !== shift.alerts.length) {
    return res.status(400).json({ message: 'Decide every alert in the queue exactly once before ending the shift.' });
  }
  if (parsed.data.decisions.some((decision) => decision.verdict === 'true_positive' && !decision.severity)) {
    return res.status(400).json({ message: 'Set a severity for every alert you mark as a true positive.' });
  }

  const result = gradeSocShift(shift, parsed.data.decisions);
  const previousBest = shiftStats(req.user!.userId, shift.slug).bestScore;
  run(
    `INSERT INTO soc_shift_attempts (id, user_id, shift_slug, score, max_score, correct_verdicts, total_alerts, duration_seconds, result_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    makeId(), req.user!.userId, shift.slug, result.score, result.maxScore, result.correctVerdicts, result.totalAlerts, parsed.data.durationSeconds ?? null, toDbJson(result), nowIso()
  );
  return res.json({ result, personalBest: previousBest === null || result.score > previousBest, ...shiftStats(req.user!.userId, shift.slug) });
});

export default router;
