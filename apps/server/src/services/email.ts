import { env } from '../config/env.js';
import { createAuditLog } from '../utils/audit.js';
import { logger } from '../utils/logger.js';
import { makeId, nowIso, run, toDbJson } from '../lib/db.js';

type SendEmailInput = {
  userId?: string | null;
  toEmail: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  messageType: string;
  metadata?: Record<string, unknown>;
};

export async function sendTransactionalEmail(input: SendEmailInput) {
  const id = makeId();
  const createdAt = nowIso();
  const metadata = input.metadata ?? {};

  run(
    `INSERT INTO email_outbox (id, user_id, to_email, subject, text_body, html_body, status, provider, message_type, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?)`,
    id,
    input.userId ?? null,
    input.toEmail,
    input.subject,
    input.textBody,
    input.htmlBody ?? null,
    env.mailMode,
    input.messageType,
    toDbJson(metadata),
    createdAt
  );

  let status: 'sent' | 'failed' = 'sent';
  try {
    if (env.mailMode === 'brevo') {
      // HTTP API instead of SMTP: Render's free tier blocks outbound SMTP ports.
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.brevoApiKey!, 'content-type': 'application/json' },
        body: JSON.stringify({
          sender: { email: env.mailFrom, name: 'CyberPath Academy' },
          to: [{ email: input.toEmail }],
          subject: input.subject,
          textContent: input.textBody,
          htmlContent: input.htmlBody
        })
      });
      if (!response.ok) throw new Error(`Brevo responded ${response.status}: ${await response.text()}`);
    } else {
      logger.info('email.queued', { toEmail: input.toEmail, subject: input.subject, messageType: input.messageType });
    }
  } catch (error) {
    status = 'failed';
    logger.error('email.send_failed', { error: error instanceof Error ? error.message : String(error), toEmail: input.toEmail });
  }

  run('UPDATE email_outbox SET status = ?, sent_at = ? WHERE id = ?', status, nowIso(), id);
  createAuditLog({
    actorUserId: input.userId ?? null,
    action: 'email.queued',
    targetType: 'email_outbox',
    targetId: id,
    metadata: { toEmail: input.toEmail, messageType: input.messageType, status }
  });

  return { id, status };
}
