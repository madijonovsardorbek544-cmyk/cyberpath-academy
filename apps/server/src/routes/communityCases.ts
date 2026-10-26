import { Router } from 'express';
import { caseDraftSchema, caseReviewSchema } from '@cyberpath/contracts';
import { findRealWorldIndicators } from '@cyberpath/contracts/cases';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { count, fromDbJson, makeId, many, nowIso, one, run, toDbJson } from '../lib/db.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();
router.use(requireAuth);

const MAX_OPEN_SUBMISSIONS = 10;
const EDITABLE = new Set(['draft', 'changes_requested']);
type Row = Record<string, unknown>;

function mapSubmission(row: Row) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    status: String(row.status),
    reviewNote: row.review_note ? String(row.review_note) : null,
    authorName: row.author_name ? String(row.author_name) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
    case: fromDbJson(row.data_json, null)
  };
}

/** Validates a draft; returns an error message or the parsed case. */
function validate(body: unknown) {
  const parsed = caseDraftSchema.safeParse((body as { case?: unknown })?.case);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue?.path.join('.') || 'case'}: ${issue?.message ?? 'invalid'}` };
  }
  const indicators = findRealWorldIndicators(parsed.data);
  if (indicators.length) {
    return { error: `Use only documentation addresses (192.0.2.x, 198.51.100.x, 203.0.113.x, private ranges) and reserved domains (.example, .test). Found: ${indicators.slice(0, 5).join(', ')}` };
  }
  return { data: parsed.data };
}

function slugFor(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'case';
  return `c-${base}-${makeId().slice(0, 6)}`;
}

router.get('/mine', (req: AuthenticatedRequest, res) => {
  const rows = many<Row>('SELECT * FROM community_cases WHERE author_id = ? ORDER BY updated_at DESC', req.user!.userId);
  return res.json({ submissions: rows.map(mapSubmission) });
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const result = validate(req.body);
  if ('error' in result) return res.status(400).json({ message: result.error });
  const open = count(`SELECT COUNT(*) AS value FROM community_cases WHERE author_id = ? AND status IN ('draft', 'submitted', 'changes_requested')`, req.user!.userId);
  if (open >= MAX_OPEN_SUBMISSIONS) return res.status(429).json({ message: `You can have up to ${MAX_OPEN_SUBMISSIONS} unpublished cases. Finish or delete one first.` });
  const id = makeId();
  const timestamp = nowIso();
  const status = req.body?.submit ? 'submitted' : 'draft';
  run('INSERT INTO community_cases (id, slug, author_id, status, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', id, slugFor(result.data.title), req.user!.userId, status, toDbJson(result.data), timestamp, timestamp);
  return res.status(201).json({ submission: mapSubmission(one<Row>('SELECT * FROM community_cases WHERE id = ?', id)) });
});

router.patch('/:id', (req: AuthenticatedRequest, res) => {
  const row = one<Row | null>('SELECT * FROM community_cases WHERE id = ? AND author_id = ?', req.params.id, req.user!.userId);
  if (!row) return res.status(404).json({ message: 'Submission not found.' });
  if (!EDITABLE.has(String(row.status))) return res.status(409).json({ message: 'Only drafts and cases with requested changes can be edited.' });
  const result = validate(req.body);
  if ('error' in result) return res.status(400).json({ message: result.error });
  run('UPDATE community_cases SET data_json = ?, status = ?, updated_at = ? WHERE id = ?', toDbJson(result.data), req.body?.submit ? 'submitted' : String(row.status), nowIso(), row.id);
  return res.json({ submission: mapSubmission(one<Row>('SELECT * FROM community_cases WHERE id = ?', row.id)) });
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const row = one<Row | null>('SELECT status FROM community_cases WHERE id = ? AND author_id = ?', req.params.id, req.user!.userId);
  if (!row) return res.status(404).json({ message: 'Submission not found.' });
  if (row.status === 'published') return res.status(409).json({ message: 'Published cases cannot be deleted by their author. Ask a mentor.' });
  run('DELETE FROM community_cases WHERE id = ?', req.params.id);
  return res.json({ ok: true });
});

router.get('/review', requireRole(['mentor', 'admin']), (_req, res) => {
  const rows = many<Row>(`SELECT c.*, u.name AS author_name FROM community_cases c JOIN users u ON u.id = c.author_id WHERE c.status = 'submitted' ORDER BY c.updated_at ASC`);
  return res.json({ submissions: rows.map(mapSubmission) });
});

router.post('/:id/review', requireRole(['mentor', 'admin']), (req: AuthenticatedRequest, res) => {
  const parsed = caseReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Choose publish, changes_requested or rejected.' });
  const row = one<Row | null>('SELECT * FROM community_cases WHERE id = ?', req.params.id);
  if (!row || row.status !== 'submitted') return res.status(404).json({ message: 'No submitted case with that id.' });
  if (row.author_id === req.user!.userId) return res.status(403).json({ message: 'Another reviewer has to review your own case.' });
  if (parsed.data.decision !== 'publish' && !parsed.data.note) return res.status(400).json({ message: 'Tell the author what to change.' });
  const timestamp = nowIso();
  run('UPDATE community_cases SET status = ?, review_note = ?, reviewer_id = ?, updated_at = ?, published_at = ? WHERE id = ?',
    parsed.data.decision === 'publish' ? 'published' : parsed.data.decision, parsed.data.note ?? null, req.user!.userId, timestamp, parsed.data.decision === 'publish' ? timestamp : null, row.id);
  createAuditLog({ actorUserId: req.user!.userId, action: `community_case.${parsed.data.decision}`, targetType: 'community_case', targetId: String(row.id) });
  return res.json({ submission: mapSubmission(one<Row>('SELECT * FROM community_cases WHERE id = ?', row.id)) });
});

export default router;
