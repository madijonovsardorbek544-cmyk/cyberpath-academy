import { findInvestigationCase, investigationCases, type InvestigationCase } from '@cyberpath/contracts/cases';
import { fromDbJson, many, one } from '../lib/db.js';
import { leaderboardName } from '@cyberpath/contracts/gamification';

export type CatalogCase = InvestigationCase & { source: 'core' | 'community'; author: string | null };

function fromRow(row: Record<string, unknown>): CatalogCase {
  const data = fromDbJson<Omit<InvestigationCase, 'slug'>>(row.data_json, {} as Omit<InvestigationCase, 'slug'>);
  return { ...data, slug: String(row.slug), source: 'community', author: leaderboardName(String(row.author_name ?? '')) };
}

/** Built-in cases first, then published community cases, oldest first. */
export function listCases(): CatalogCase[] {
  const community = many<Record<string, unknown>>(`SELECT c.slug, c.data_json, u.name AS author_name FROM community_cases c JOIN users u ON u.id = c.author_id WHERE c.status = 'published' ORDER BY c.published_at ASC`);
  return [...investigationCases.map((item) => ({ ...item, source: 'core' as const, author: null })), ...community.map(fromRow)];
}

export function findCase(slug: string): CatalogCase | null {
  const core = findInvestigationCase(slug);
  if (core) return { ...core, source: 'core', author: null };
  const row = one<Record<string, unknown> | null>(`SELECT c.slug, c.data_json, u.name AS author_name FROM community_cases c JOIN users u ON u.id = c.author_id WHERE c.slug = ? AND c.status = 'published'`, slug);
  return row ? fromRow(row) : null;
}
