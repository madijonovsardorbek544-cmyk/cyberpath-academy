import { Router } from 'express';
import { profilePatchSchema } from '@cyberpath/contracts';
import { listCases } from '../utils/caseCatalog.js';
import { gradeSocShift, socShifts } from '@cyberpath/contracts/soc';
import { analystExam } from '@cyberpath/contracts/exam';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { many, one, run } from '../lib/db.js';
import { getLearnerProgress } from '../utils/gamification.js';

const router = Router();
type Row = Record<string, unknown>;

function settings(userId: string) {
  const row = one<Row>('SELECT profile_handle, profile_public, profile_headline, open_to_work FROM users WHERE id = ?', userId);
  return { handle: row.profile_handle ? String(row.profile_handle) : null, isPublic: Boolean(row.profile_public), headline: String(row.profile_headline ?? ''), openToWork: Boolean(row.open_to_work) };
}

/** Everything a public profile shows. Only earned achievements and already-published work. */
function publicProfile(userId: string) {
  const user = one<Row>('SELECT name, created_at FROM users WHERE id = ?', userId);
  const progress = getLearnerProgress(userId, new Date(), { league: false });
  const solved = many<Row>('SELECT case_slug, COUNT(*) AS solved, MAX(solved_at) AS closed_at FROM case_progress WHERE user_id = ? AND solved_at IS NOT NULL GROUP BY case_slug', userId);
  const cases = listCases().flatMap((item) => {
    const row = solved.find((entry) => entry.case_slug === item.slug);
    return row && Number(row.solved) === item.questions.length ? [{ slug: item.slug, title: item.title, category: item.category, difficulty: item.difficulty, closedAt: String(row.closed_at) }] : [];
  });
  const bests = many<Row>('SELECT shift_slug, MAX(score) AS best FROM soc_shift_attempts WHERE user_id = ? GROUP BY shift_slug', userId);
  const soc = socShifts.flatMap((shift) => {
    const row = bests.find((entry) => entry.shift_slug === shift.slug);
    return row ? [{ slug: shift.slug, title: shift.title, bestScore: Number(row.best), maxScore: gradeSocShift(shift, []).maxScore }] : [];
  });
  const artifacts = many<Row>("SELECT title, artifact_type, public_share_id FROM portfolio_artifacts WHERE user_id = ? AND status = 'published' AND public_share_id IS NOT NULL ORDER BY published_at DESC", userId)
    .map((row) => ({ title: String(row.title), type: String(row.artifact_type), shareId: String(row.public_share_id) }));
  const certificates = many<Row>("SELECT title, issued_at FROM certificate_awards WHERE user_id = ? AND status = 'issued' AND issued_at IS NOT NULL ORDER BY issued_at DESC", userId)
    .map((row) => ({ title: String(row.title), issuedAt: String(row.issued_at), verifyCode: null as string | null }));
  const exams = many<Row>("SELECT reviewed_at, certificate_code FROM exam_attempts WHERE user_id = ? AND status = 'passed' ORDER BY reviewed_at DESC", userId)
    .map((row) => ({ title: analystExam.title, issuedAt: String(row.reviewed_at), verifyCode: String(row.certificate_code) }));
  return {
    ...settings(userId),
    name: String(user.name),
    memberSince: String(user.created_at),
    level: progress.xp.level,
    totalXp: progress.xp.total,
    streak: progress.streak.current,
    badges: progress.badges.filter((badge) => badge.earnedAt),
    cases,
    soc,
    artifacts,
    certificates: [...exams, ...certificates]
  };
}

router.get('/public/:handle', (req, res) => {
  const row = one<Row | null>('SELECT id FROM users WHERE profile_handle = ? AND profile_public = 1', String(req.params.handle).toLowerCase());
  if (!row) return res.status(404).json({ message: 'This profile does not exist or is private.' });
  const { isPublic: _isPublic, ...profile } = publicProfile(String(row.id));
  return res.json({ profile });
});

// Learners who made their profile public and opted in to being found by employers.
// shortcut: builds every profile on each request and caps at 100, add paging when the list grows.
router.get('/talent', (req, res) => {
  const certifiedOnly = req.query.certified === '1';
  const rows = many<Row>('SELECT id FROM users WHERE profile_public = 1 AND open_to_work = 1 AND profile_handle IS NOT NULL');
  const talent = rows.map((row) => publicProfile(String(row.id)))
    .map((profile) => ({ handle: profile.handle!, name: profile.name, headline: profile.headline, level: profile.level, totalXp: profile.totalXp, casesClosed: profile.cases.length, badges: profile.badges.length, certified: profile.certificates.some((item) => item.verifyCode) }))
    .filter((entry) => !certifiedOnly || entry.certified)
    .sort((a, b) => Number(b.certified) - Number(a.certified) || b.totalXp - a.totalXp)
    .slice(0, 100);
  return res.json({ talent });
});

router.use(requireAuth);

router.get('/me', (req: AuthenticatedRequest, res) => res.json({ settings: settings(req.user!.userId) }));

router.patch('/me', (req: AuthenticatedRequest, res) => {
  const parsed = profilePatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid profile settings.' });
  const userId = req.user!.userId;
  const next = { ...settings(userId), ...parsed.data };
  if (next.isPublic && !next.handle) return res.status(400).json({ message: 'Choose a handle before making your profile public.' });
  if (parsed.data.handle) {
    const taken = one<Row | null>('SELECT id FROM users WHERE profile_handle = ? AND id != ?', parsed.data.handle, userId);
    if (taken) return res.status(409).json({ message: 'That handle is already taken.' });
  }
  run('UPDATE users SET profile_handle = ?, profile_public = ?, profile_headline = ?, open_to_work = ? WHERE id = ?', next.handle, next.isPublic ? 1 : 0, next.headline, next.openToWork ? 1 : 0, userId);
  return res.json({ settings: settings(userId) });
});

export default router;
