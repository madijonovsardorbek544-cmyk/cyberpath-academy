import { findInvestigationCase, investigationCases, type InvestigationCase } from '@cyberpath/contracts/cases';
import { fromDbJson, many, one } from '../lib/db.js';
import { leaderboardName } from '@cyberpath/contracts/gamification';
import { annualEvent, findUnlockedEventDay } from '@cyberpath/contracts/event';
import { env } from '../config/env.js';

export type CatalogCase = InvestigationCase & { source: 'core' | 'community' | 'event'; author: string | null };

function fromRow(row: Record<string, unknown>): CatalogCase {
  const data = fromDbJson<Omit<InvestigationCase, 'slug'>>(row.data_json, {} as Omit<InvestigationCase, 'slug'>);
  return { ...data, slug: String(row.slug), source: 'community', author: leaderboardName(String(row.author_name ?? '')) };
}

/** Built-in cases first, then published community cases, oldest first. */
export function listCases(): CatalogCase[] {
  const community = many<Record<string, unknown>>(`SELECT c.slug, c.data_json, u.name AS author_name FROM community_cases c JOIN users u ON u.id = c.author_id WHERE c.status = 'published' ORDER BY c.published_at ASC`);
  return [...investigationCases.map((item) => ({ ...item, source: 'core' as const, author: null })), ...community.map(fromRow)];
}

export const eventStartsOn = () => env.eventStartDate ?? annualEvent.startsOn;

/** Any playable case: core, published community, or an event day that has unlocked. */
export function findCase(slug: string, now = new Date()): CatalogCase | null {
  const core = findInvestigationCase(slug);
  if (core) return { ...core, source: 'core', author: null };
  const eventDay = findUnlockedEventDay(annualEvent, eventStartsOn(), slug, now);
  if (eventDay) return { ...eventDay, source: 'event', author: null };
  const row = one<Record<string, unknown> | null>(`SELECT c.slug, c.data_json, u.name AS author_name FROM community_cases c JOIN users u ON u.id = c.author_id WHERE c.slug = ? AND c.status = 'published'`, slug);
  return row ? fromRow(row) : null;
}
