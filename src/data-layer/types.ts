import type { RawLevel, RawValue } from '@/engine/risk/rawValues';
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

export type AuditAction = 'submitted' | 'approved' | 'rejected' | 'reverted' | 'imported' | 'reset' | 'assigned' | 'requested' | 'validated' | 'closed';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  unitId?: string;
  unitName?: string;
  detail?: string;
}

export interface Profile {
  id: string;
  email?: string | null;
  fullName: string;
  institution?: string | null;
  /** The institution this user enters data for (set by an administrator). */
  institutionKey?: string | null;
  role: Role;
}

/* ------------------------------------------------------------------------------------------------ */
/* Institutional data workflow                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export type InstitutionKind = 'national' | 'global';

export interface Institution {
  key: string;
  label: string;
  fullName: string;
  kind: InstitutionKind;
}

/** The institution responsible for one workbook indicator. */
export interface Assignment {
  specId: string;
  institutionKey: string;
  note?: string | null;
  assignedAt: string;
}

export type RequestKind = 'update' | 'validate';
export type RequestStatus = 'open' | 'submitted' | 'done' | 'cancelled';

/** A request from the PMO to an institution: update the values of an indicator, or confirm they are current. */
/** Review note stored when a reviewer applies their own values directly (shown translated in the UI). */
export const APPLIED_DIRECTLY_NOTE = 'Applied directly by reviewer';

export interface DataRequest {
  id: string;
  specId: string;
  institutionKey: string;
  kind: RequestKind;
  message?: string | null;
  /** ISO date (yyyy-mm-dd). */
  dueDate?: string | null;
  status: RequestStatus;
  createdByName: string;
  createdAt: string;
  closedAt?: string | null;
  responseNote?: string | null;
}

/** One measured value inside a submission. */
export interface RawEntry {
  unitId: string;
  level: RawLevel;
  value: number | null;
  /** Value that applied before (for the review diff). */
  previous?: number | null;
}

export interface RawSubmission {
  id: string;
  specId: string;
  institutionKey?: string | null;
  requestId?: string | null;
  entries: RawEntry[];
  dataset: string;
  period?: string | null;
  note?: string | null;
  authorId?: string | null;
  authorName: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  reviewNote?: string | null;
}

export interface NewRawSubmission {
  specId: string;
  entries: RawEntry[];
  dataset: string;
  period?: string;
  note?: string;
  requestId?: string | null;
}

/** "The current values are still correct", confirmed by the owning institution. */
export interface Validation {
  id: string;
  specId: string;
  institutionKey?: string | null;
  requestId?: string | null;
  note?: string | null;
  validatedByName: string;
  validatedAt: string;
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

  listInstitutions(): Promise<Institution[]>;
  listAssignments(): Promise<Assignment[]>;
  /** Assign indicators to an institution (null unassigns). Returns how many changed. */
  assign(specIds: string[], institutionKey: string | null, actor: Profile, note?: string): Promise<number>;
  listRequests(): Promise<DataRequest[]>;
  /** One request per assigned indicator; unassigned indicators are skipped. Returns how many were sent. */
  createRequests(specIds: string[], kind: RequestKind, dueDate: string | null, message: string | undefined, actor: Profile): Promise<number>;
  closeRequest(id: string, status: 'done' | 'cancelled', actor: Profile, note?: string): Promise<void>;
  /** Approved measured values (public). */
  getRawValues(): Promise<RawValue[]>;
  listRawSubmissions(): Promise<RawSubmission[]>;
  submitRaw(input: NewRawSubmission, author: Profile): Promise<RawSubmission>;
  reviewRaw(id: string, decision: 'approved' | 'rejected', reviewer: Profile, note?: string): Promise<void>;
  revertRaw(specId: string, unitId: string, actor: Profile): Promise<void>;
  listValidations(): Promise<Validation[]>;
  confirmValues(specId: string, requestId: string | null, actor: Profile, note?: string): Promise<void>;
  /** Everyone with an account (reviewers only). */
  listProfiles(): Promise<Profile[]>;
  /** Set a user's role and institution (administrators only). */
  updateProfile(id: string, patch: { role?: Role; institutionKey?: string | null }): Promise<void>;
}

export const canReview = (role: Role | undefined | null) => role === 'pmo' || role === 'admin';
export const canSubmit = (role: Role | undefined | null) => role === 'sector' || role === 'pmo' || role === 'admin';

/** Mirrors the database rule: reviewers may enter any indicator, officers only their institution's. */
export function canEnterIndicator(profile: Profile | null | undefined, specId: string, assignments: readonly Assignment[]): boolean {
  if (!profile) return false;
  if (canReview(profile.role)) return true;
  if (profile.role !== 'sector' || !profile.institutionKey) return false;
  return assignments.some((a) => a.specId === specId && a.institutionKey === profile.institutionKey);
}

/** A request is overdue when nothing has been sent back by its due date. */
export function isOverdue(r: Pick<DataRequest, 'status' | 'dueDate'>, today = new Date()): boolean {
  if (!r.dueDate || r.status !== 'open') return false;
  return r.dueDate < today.toISOString().slice(0, 10);
}
