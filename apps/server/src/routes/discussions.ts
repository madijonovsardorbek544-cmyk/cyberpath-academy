import { Router } from 'express';
import { discussionModerateSchema, discussionPostSchema, discussionReportSchema } from '@cyberpath/contracts';
import { leaderboardName } from '@cyberpath/contracts/gamification';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { count, makeId, many, nowIso, one, run } from '../lib/db.js';
import { createAuditLog } from '../utils/audit.js';
import { findCase } from '../utils/caseCatalog.js';

const router = Router();
router.use(requireAuth);

/** Posts hide themselves for moderator review once this many learners report them. */
const AUTO_HIDE_REPORTS = 3;
const MAX_POSTS_PER_HOUR = 20;
const STAFF = new Set(['mentor', 'admin']);
type Row = Record<string, unknown>;

function mapPost(row: Row, viewerId: string) {
  return {
    id: String(row.id),
    kind: String(row.kind),
    body: String(row.body),
    status: String(row.status),
    author: leaderboardName(String(row.author_name ?? '')),
    authorRole: STAFF.has(String(row.author_role)) ? String(row.author_role) : null,
    isMine: String(row.user_id) === viewerId,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

const POST_SELECT = `SELECT p.*, u.name AS author_name, u.role AS author_role FROM discussion_posts p JOIN users u ON u.id = p.user_id`;

/** Resolves the target and whether the viewer has finished it (writeups unlock after solving). */
function resolveTarget(type: string, slug: string, userId: string) {
  if (type === 'lesson') {
    return one<Row | null>('SELECT id FROM lessons WHERE slug = ?', slug) ? { allowsWriteups: false, completed: false } : null;
  }
  if (type === 'case') {
    const item = findCase(slug);
    if (!item) return null;
    const solved = count('SELECT COUNT(*) AS value FROM case_progress WHERE user_id = ? AND case_slug = ? AND solved_at IS NOT NULL', userId, item.slug);
    return { allowsWriteups: true, completed: solved === item.questions.length };
  }
  return null;
}

router.get('/moderation', requireRole(['mentor', 'admin']), (req: AuthenticatedRequest, res) => {
  const rows = many<Row>(`${POST_SELECT} WHERE p.status = 'hidden' OR p.report_count > 0 ORDER BY p.status = 'hidden' DESC, p.report_count DESC, p.created_at DESC LIMIT 100`);
  const posts = rows.map((row) => ({
    ...mapPost(row, req.user!.userId),
    targetType: String(row.target_type),
    targetSlug: String(row.target_slug),
    reportCount: Number(row.report_count),
    reasons: many<{ reason: string }>('SELECT reason FROM discussion_reports WHERE post_id = ? ORDER BY created_at ASC', row.id).map((report) => report.reason)
  }));
  return res.json({ posts });
});

router.get('/:type/:slug', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const type = String(req.params.type);
  const slug = String(req.params.slug);
  const target = resolveTarget(type, slug, userId);
  if (!target) return res.status(404).json({ message: 'Nothing to discuss here.' });
  const staff = STAFF.has(req.user!.role);
  // Hidden posts stay visible to their author and to moderators so nothing silently disappears.
  const visible = (kind: string) => many<Row>(
    `${POST_SELECT} WHERE p.target_type = ? AND p.target_slug = ? AND p.kind = ? AND (p.status = 'visible' OR p.user_id = ? OR ?) ORDER BY p.created_at ASC`,
    type, slug, kind, userId, staff ? 1 : 0
  ).map((row) => mapPost(row, userId));

  const writeupsUnlocked = target.allowsWriteups && (target.completed || staff);
  return res.json({
    comments: visible('comment'),
    writeups: writeupsUnlocked ? visible('writeup') : [],
    writeupsAllowed: target.allowsWriteups,
    writeupsUnlocked,
    canWriteWriteup: target.allowsWriteups && target.completed
  });
});

router.post('/:type/:slug', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const type = String(req.params.type);
  const slug = String(req.params.slug);
  const target = resolveTarget(type, slug, userId);
  if (!target) return res.status(404).json({ message: 'Nothing to discuss here.' });
  const parsed = discussionPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid post.' });
  if (parsed.data.kind === 'writeup' && !(target.allowsWriteups && target.completed)) {
    return res.status(403).json({ message: 'Finish the case before writing a writeup.' });
  }
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  if (count('SELECT COUNT(*) AS value FROM discussion_posts WHERE user_id = ? AND created_at > ?', userId, since) >= MAX_POSTS_PER_HOUR) {
    return res.status(429).json({ message: 'You are posting very fast. Try again in a little while.' });
  }

  const timestamp = nowIso();
  if (parsed.data.kind === 'writeup') {
    const existing = one<Row | null>(`SELECT id FROM discussion_posts WHERE target_type = ? AND target_slug = ? AND user_id = ? AND kind = 'writeup'`, type, slug, userId);
    if (existing) {
      run('UPDATE discussion_posts SET body = ?, updated_at = ? WHERE id = ?', parsed.data.body, timestamp, existing.id);
      return res.json({ post: mapPost(one<Row>(`${POST_SELECT} WHERE p.id = ?`, existing.id), userId) });
    }
  }
  const id = makeId();
  run(
    `INSERT INTO discussion_posts (id, target_type, target_slug, user_id, kind, body, status, report_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'visible', 0, ?, ?)`,
    id, type, slug, userId, parsed.data.kind, parsed.data.body, timestamp, timestamp
  );
  return res.status(201).json({ post: mapPost(one<Row>(`${POST_SELECT} WHERE p.id = ?`, id), userId) });
});

router.delete('/posts/:id', (req: AuthenticatedRequest, res) => {
  const post = one<Row | null>('SELECT id, user_id FROM discussion_posts WHERE id = ?', String(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  const staff = STAFF.has(req.user!.role);
  if (String(post.user_id) !== req.user!.userId && !staff) return res.status(403).json({ message: 'You can only delete your own posts.' });
  run('DELETE FROM discussion_posts WHERE id = ?', post.id);
  if (staff && String(post.user_id) !== req.user!.userId) {
    createAuditLog({ actorUserId: req.user!.userId, action: 'discussion.delete', targetType: 'discussion_post', targetId: String(post.id) });
  }
  return res.json({ ok: true });
});

router.post('/posts/:id/report', (req: AuthenticatedRequest, res) => {
  const post = one<Row | null>('SELECT id, user_id FROM discussion_posts WHERE id = ?', String(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  if (String(post.user_id) === req.user!.userId) return res.status(400).json({ message: 'You cannot report your own post.' });
  const parsed = discussionReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Say briefly what is wrong with this post.' });
  const inserted = run('INSERT OR IGNORE INTO discussion_reports (id, post_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?)', makeId(), post.id, req.user!.userId, parsed.data.reason, nowIso());
  if (Number(inserted.changes) > 0) {
    run(`UPDATE discussion_posts SET report_count = report_count + 1, status = CASE WHEN report_count + 1 >= ? THEN 'hidden' ELSE status END WHERE id = ?`, AUTO_HIDE_REPORTS, post.id);
  }
  return res.json({ ok: true });
});

router.post('/posts/:id/moderate', requireRole(['mentor', 'admin']), (req: AuthenticatedRequest, res) => {
  const parsed = discussionModerateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Choose hide or restore.' });
  const post = one<Row | null>('SELECT id FROM discussion_posts WHERE id = ?', String(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  if (parsed.data.action === 'hide') run(`UPDATE discussion_posts SET status = 'hidden' WHERE id = ?`, post.id);
  else {
    // Restoring clears the reports so the post does not bounce straight back into the queue.
    run(`UPDATE discussion_posts SET status = 'visible', report_count = 0 WHERE id = ?`, post.id);
    run('DELETE FROM discussion_reports WHERE post_id = ?', post.id);
  }
  createAuditLog({ actorUserId: req.user!.userId, action: `discussion.${parsed.data.action}`, targetType: 'discussion_post', targetId: String(post.id) });
  return res.json({ post: mapPost(one<Row>(`${POST_SELECT} WHERE p.id = ?`, post.id), req.user!.userId) });
});

export default router;
