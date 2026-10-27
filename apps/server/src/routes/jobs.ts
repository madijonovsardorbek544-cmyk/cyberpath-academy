import { Router } from 'express';
import { jobPostSchema, jobReviewSchema } from '@cyberpath/contracts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { count, makeId, many, nowIso, one, run } from '../lib/db.js';
import { createAuditLog } from '../utils/audit.js';

// A free jobs board: anyone signed in can submit a listing, a mentor or admin approves it,
// and approved listings stay up for 60 days unless the poster closes them sooner.
const router = Router();
type Row = Record<string, unknown>;

const LISTING_DAYS = 60;
const MAX_POSTS_PER_DAY = 5;
const isStaff = (req: AuthenticatedRequest) => req.user!.role === 'mentor' || req.user!.role === 'admin';

function jobView(row: Row, withReview = false) {
  return {
    id: String(row.id),
    title: String(row.title),
    company: String(row.company),
    location: String(row.location),
    remote: Boolean(row.remote),
    kind: String(row.kind),
    description: String(row.description),
    applyUrl: String(row.apply_url),
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    ...(withReview ? { status: String(row.status), reviewNote: row.review_note ? String(row.review_note) : null, createdAt: String(row.created_at), posterName: row.poster_name ? String(row.poster_name) : undefined } : {})
  };
}

router.get('/', (_req, res) => {
  const jobs = many<Row>("SELECT * FROM job_posts WHERE status = 'approved' AND expires_at > ? ORDER BY approved_at DESC LIMIT 200", nowIso());
  return res.json({ jobs: jobs.map((row) => jobView(row)) });
});

router.use(requireAuth);

router.get('/mine', (req: AuthenticatedRequest, res) => {
  const jobs = many<Row>('SELECT * FROM job_posts WHERE poster_id = ? ORDER BY created_at DESC', req.user!.userId);
  return res.json({ jobs: jobs.map((row) => jobView(row, true)) });
});

router.get('/review', (req: AuthenticatedRequest, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Only mentors and admins review job listings.' });
  const jobs = many<Row>("SELECT j.*, u.name AS poster_name FROM job_posts j JOIN users u ON u.id = j.poster_id WHERE j.status = 'pending' ORDER BY j.created_at ASC");
  return res.json({ jobs: jobs.map((row) => jobView(row, true)) });
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const parsed = jobPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: `${parsed.error.issues[0]?.path.join('.')}: ${parsed.error.issues[0]?.message}` });
  const userId = req.user!.userId;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (count('SELECT COUNT(*) AS value FROM job_posts WHERE poster_id = ? AND created_at > ?', userId, since) >= MAX_POSTS_PER_DAY) {
    return res.status(429).json({ message: `You can submit up to ${MAX_POSTS_PER_DAY} listings a day.` });
  }
  const data = parsed.data;
  const id = makeId();
  run(
    `INSERT INTO job_posts (id, poster_id, title, company, location, remote, kind, description, apply_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    id, userId, data.title, data.company, data.location, data.remote ? 1 : 0, data.kind, data.description, data.applyUrl, nowIso()
  );
  return res.status(201).json({ job: jobView(one<Row>('SELECT * FROM job_posts WHERE id = ?', id), true) });
});

router.post('/:id/review', (req: AuthenticatedRequest, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Only mentors and admins review job listings.' });
  const parsed = jobReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid review.' });
  const row = one<Row | null>("SELECT * FROM job_posts WHERE id = ? AND status = 'pending'", String(req.params.id));
  if (!row) return res.status(404).json({ message: 'This listing is not waiting for review.' });
  const now = new Date();
  const approve = parsed.data.decision === 'approve';
  run(
    'UPDATE job_posts SET status = ?, review_note = ?, reviewer_id = ?, approved_at = ?, expires_at = ? WHERE id = ?',
    approve ? 'approved' : 'rejected', parsed.data.note ?? null, req.user!.userId,
    approve ? now.toISOString() : null, approve ? new Date(now.getTime() + LISTING_DAYS * 24 * 60 * 60 * 1000).toISOString() : null, row.id
  );
  createAuditLog({ actorUserId: req.user!.userId, action: `job.${parsed.data.decision}`, targetType: 'job_post', targetId: String(row.id) });
  return res.json({ job: jobView(one<Row>('SELECT * FROM job_posts WHERE id = ?', row.id), true) });
});

router.post('/:id/close', (req: AuthenticatedRequest, res) => {
  const row = one<Row | null>('SELECT * FROM job_posts WHERE id = ?', String(req.params.id));
  if (!row || (String(row.poster_id) !== req.user!.userId && !isStaff(req))) return res.status(404).json({ message: 'Listing not found.' });
  run("UPDATE job_posts SET status = 'closed' WHERE id = ?", row.id);
  return res.json({ job: jobView(one<Row>('SELECT * FROM job_posts WHERE id = ?', row.id), true) });
});

export default router;
