import type { EditRef, Overrides } from '@/engine/risk/types';

export type Role = 'viewer' | 'sector' | 'pmo' | 'admin';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/** One indicator change inside a submission. `value` is the 0–10 score (null = mark as no data). */
export interface Change {
  ref: EditRef;
  value: number | null;
  /** Previous value at submission time (for review diffs). */
  previous?: number | null;
  /** When keyed as a raw value: the workbook indicator id, its raw value and unit. */
  raw?: { specId: string; value: number | string; unit?: string | null } | null;
}

export interface Submission {
  id: string;
  unitId: string;
  unitName: string;
  region: string;
  changes: Change[];
  authority: string;
  dataset?: string | null;
  note?: string | null;
  authorId?: string | null;
  authorName: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  reviewNote?: string | null;
}

export interface NewSubmission {
  unitId: string;
  unitName: string;
  region: string;
  changes: Change[];
  authority: string;
  dataset?: string;
  note?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: 'submitted' | 'approved' | 'rejected' | 'reverted' | 'imported' | 'reset';
  unitId?: string;
  unitName?: string;
  detail?: string;
}

export interface Profile {
  id: string;
  email?: string | null;
  fullName: string;
  institution?: string | null;
  role: Role;
}

/** Storage-agnostic repository. Local (browser) and Supabase implementations share this contract. */
export interface Repository {
  readonly mode: 'local' | 'supabase';
  getOverrides(): Promise<Overrides>;
  listSubmissions(): Promise<Submission[]>;
  submit(input: NewSubmission, author: Profile): Promise<Submission>;
  review(id: string, decision: 'approved' | 'rejected', reviewer: Profile, note?: string): Promise<void>;
  revert(unitId: string, ref: EditRef, actor: Profile): Promise<void>;
  listAudit(limit?: number): Promise<AuditEntry[]>;
  /** Local mode only: wipe everything stored in this browser. */
  resetAll?(actor: Profile): Promise<void>;
}

export const canReview = (role: Role | undefined | null) => role === 'pmo' || role === 'admin';
export const canSubmit = (role: Role | undefined | null) => role === 'sector' || role === 'pmo' || role === 'admin';
