import type { Role } from '../lib/db.js';
import { makeId, nowIso, run, toDbJson } from '../lib/db.js';

type AuditInput = {
  actorUserId?: string | null;
  actorRole?: Role | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export function createAuditLog(input: AuditInput) {
  run(
    `INSERT INTO audit_logs (id, actor_user_id, actor_role, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    makeId(),
    input.actorUserId ?? null,
    input.actorRole ?? null,
    input.action,
    input.targetType,
    input.targetId ?? null,
    toDbJson(input.metadata ?? {}),
    nowIso()
  );
}
