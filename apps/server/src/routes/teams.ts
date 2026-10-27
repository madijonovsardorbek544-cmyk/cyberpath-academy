import crypto from 'node:crypto';
import { Router } from 'express';
import { teamCreateSchema, teamJoinSchema } from '@cyberpath/contracts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { count, makeId, many, nowIso, one, run } from '../lib/db.js';
import { createAuditLog } from '../utils/audit.js';
import { listCases } from '../utils/caseCatalog.js';

// Teams let a school class or company group join with a code and give their leader a progress view.
// They reuse the cohorts tables; any learner can lead a team, and leaders only see people who joined.
const router = Router();
router.use(requireAuth);

const MAX_TEAMS_PER_LEADER = 20;
const MAX_MEMBERS = 500;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
type Row = Record<string, unknown>;

function newJoinCode() {
  return Array.from(crypto.randomBytes(8), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

function slugFor(name: string) {
  return `team-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'group'}-${crypto.randomBytes(3).toString('hex')}`;
}

function teamSummary(row: Row, viewerId: string) {
  const isLeader = String(row.mentor_id) === viewerId;
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    leader: String(row.leader_name ?? ''),
    isLeader,
    joinCode: isLeader ? String(row.join_code) : null,
    memberCount: count(`SELECT COUNT(*) AS value FROM cohort_members WHERE cohort_id = ? AND membership_role = 'student'`, row.id),
    createdAt: String(row.created_at)
  };
}

function leadTeam(req: AuthenticatedRequest) {
  const row = one<Row | null>('SELECT c.*, u.name AS leader_name FROM cohorts c JOIN users u ON u.id = c.mentor_id WHERE c.id = ? AND c.join_code IS NOT NULL', String(req.params.id));
  if (!row) return null;
  return String(row.mentor_id) === req.user!.userId || req.user!.role === 'admin' ? row : null;
}

/** One row per member: what a teacher or manager needs to see who is progressing. */
function memberProgress(teamId: string) {
  const cases = listCases();
  const members = many<Row>(
    `SELECT u.id, u.name, u.email, cm.joined_at FROM cohort_members cm JOIN users u ON u.id = cm.user_id
     WHERE cm.cohort_id = ? AND cm.membership_role = 'student' ORDER BY u.name ASC`, teamId
  );
  return members.map((member) => {
    const userId = String(member.id);
    const solved = new Map(many<Row>('SELECT case_slug, COUNT(*) AS solved FROM case_progress WHERE user_id = ? AND solved_at IS NOT NULL GROUP BY case_slug', userId).map((row) => [String(row.case_slug), Number(row.solved)]));
    const exam = one<Row | null>(
      `SELECT status FROM exam_attempts WHERE user_id = ?
       ORDER BY CASE status WHEN 'passed' THEN 0 WHEN 'submitted' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, started_at DESC LIMIT 1`, userId
    );
    const lastActive = one<Row>(
      `SELECT MAX(at) AS at FROM (
         SELECT MAX(last_opened_at) AS at FROM lesson_progress WHERE user_id = ?
         UNION ALL SELECT MAX(updated_at) FROM case_progress WHERE user_id = ?
         UNION ALL SELECT MAX(earned_at) FROM xp_events WHERE user_id = ?)`, userId, userId, userId
    );
    return {
      id: userId,
      name: String(member.name),
      email: String(member.email),
      joinedAt: String(member.joined_at),
      lessonsCompleted: count('SELECT COUNT(*) AS value FROM lesson_progress WHERE user_id = ? AND completed = 1', userId),
      casesClosed: cases.filter((item) => solved.get(item.slug) === item.questions.length).length,
      xp: count('SELECT COALESCE(SUM(xp), 0) AS value FROM xp_events WHERE user_id = ?', userId),
      examStatus: exam ? String(exam.status) : null,
      lastActiveAt: lastActive.at ? String(lastActive.at) : null
    };
  });
}

router.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const leading = many<Row>('SELECT c.*, u.name AS leader_name FROM cohorts c JOIN users u ON u.id = c.mentor_id WHERE c.mentor_id = ? AND c.join_code IS NOT NULL ORDER BY c.created_at DESC', userId);
  const member = many<Row>(
    `SELECT c.*, u.name AS leader_name FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id JOIN users u ON u.id = c.mentor_id
     WHERE cm.user_id = ? AND cm.membership_role = 'student' AND c.join_code IS NOT NULL ORDER BY cm.joined_at DESC`, userId
  );
  return res.json({ leading: leading.map((row) => teamSummary(row, userId)), memberOf: member.map((row) => teamSummary(row, userId)) });
});

router.post('/', (req: AuthenticatedRequest, res) => {
  const parsed = teamCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid team.' });
  const userId = req.user!.userId;
  if (count('SELECT COUNT(*) AS value FROM cohorts WHERE mentor_id = ? AND join_code IS NOT NULL', userId) >= MAX_TEAMS_PER_LEADER) {
    return res.status(409).json({ message: `You can lead up to ${MAX_TEAMS_PER_LEADER} teams.` });
  }
  const id = makeId();
  const timestamp = nowIso();
  run(
    `INSERT INTO cohorts (id, slug, name, description, mentor_id, cadence, start_date, end_date, created_at, join_code) VALUES (?, ?, ?, ?, ?, 'self-paced', ?, NULL, ?, ?)`,
    id, slugFor(parsed.data.name), parsed.data.name, parsed.data.description ?? '', userId, timestamp.slice(0, 10), timestamp, newJoinCode()
  );
  createAuditLog({ actorUserId: userId, action: 'team.create', targetType: 'cohort', targetId: id });
  return res.status(201).json({ team: teamSummary(one<Row>('SELECT c.*, u.name AS leader_name FROM cohorts c JOIN users u ON u.id = c.mentor_id WHERE c.id = ?', id), userId) });
});

router.get('/invite/:code', (req: AuthenticatedRequest, res) => {
  const parsed = teamJoinSchema.safeParse({ code: req.params.code });
  const row = parsed.success ? one<Row | null>('SELECT c.*, u.name AS leader_name FROM cohorts c JOIN users u ON u.id = c.mentor_id WHERE c.join_code = ?', parsed.data.code) : null;
  if (!row) return res.status(404).json({ message: 'This join code does not match a team.' });
  const alreadyMember = Boolean(one<Row | null>('SELECT id FROM cohort_members WHERE cohort_id = ? AND user_id = ?', row.id, req.user!.userId));
  return res.json({ team: { name: String(row.name), description: String(row.description), leader: String(row.leader_name) }, alreadyMember, isLeader: String(row.mentor_id) === req.user!.userId });
});

router.post('/join', (req: AuthenticatedRequest, res) => {
  const parsed = teamJoinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid code.' });
  const row = one<Row | null>('SELECT c.*, u.name AS leader_name FROM cohorts c JOIN users u ON u.id = c.mentor_id WHERE c.join_code = ?', parsed.data.code);
  if (!row) return res.status(404).json({ message: 'This join code does not match a team.' });
  const userId = req.user!.userId;
  if (String(row.mentor_id) === userId) return res.status(400).json({ message: 'You already lead this team.' });
  if (count(`SELECT COUNT(*) AS value FROM cohort_members WHERE cohort_id = ? AND membership_role = 'student'`, row.id) >= MAX_MEMBERS) {
    return res.status(409).json({ message: 'This team is full. Ask the leader to start another one.' });
  }
  run(`INSERT OR IGNORE INTO cohort_members (id, cohort_id, user_id, membership_role, joined_at) VALUES (?, ?, ?, 'student', ?)`, makeId(), row.id, userId, nowIso());
  return res.json({ team: teamSummary(row, userId) });
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  const row = leadTeam(req);
  if (!row) return res.status(404).json({ message: 'Team not found.' });
  return res.json({ team: teamSummary(row, req.user!.userId), members: memberProgress(String(row.id)) });
});

router.post('/:id/rotate-code', (req: AuthenticatedRequest, res) => {
  const row = leadTeam(req);
  if (!row) return res.status(404).json({ message: 'Team not found.' });
  run('UPDATE cohorts SET join_code = ? WHERE id = ?', newJoinCode(), row.id);
  return res.json({ team: teamSummary(one<Row>('SELECT c.*, u.name AS leader_name FROM cohorts c JOIN users u ON u.id = c.mentor_id WHERE c.id = ?', row.id), req.user!.userId) });
});

router.delete('/:id/members/:userId', (req: AuthenticatedRequest, res) => {
  const team = one<Row | null>('SELECT * FROM cohorts WHERE id = ? AND join_code IS NOT NULL', String(req.params.id));
  if (!team) return res.status(404).json({ message: 'Team not found.' });
  const target = String(req.params.userId);
  const allowed = target === req.user!.userId || String(team.mentor_id) === req.user!.userId || req.user!.role === 'admin';
  if (!allowed) return res.status(403).json({ message: 'Only the team leader can remove other members.' });
  run(`DELETE FROM cohort_members WHERE cohort_id = ? AND user_id = ? AND membership_role = 'student'`, team.id, target);
  return res.json({ ok: true });
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const row = leadTeam(req);
  if (!row) return res.status(404).json({ message: 'Team not found.' });
  run('DELETE FROM cohorts WHERE id = ?', row.id);
  createAuditLog({ actorUserId: req.user!.userId, action: 'team.delete', targetType: 'cohort', targetId: String(row.id) });
  return res.json({ ok: true });
});

export default router;
