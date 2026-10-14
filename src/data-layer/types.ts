import type { RawLevel, RawValue } from '@/engine/risk/rawValues';
import type { EditRef, Overrides } from '@/engine/risk/types';

export type Role = 'viewer' | 'sector' | 'ddrrc' | 'rdrrc' | 'ndrrc' | 'pmo' | 'admin';
/** Every role, least to most powerful. Committee roles act within an area scope (D8). */
export const ROLES: readonly Role[] = ['viewer', 'sector', 'ddrrc', 'rdrrc', 'ndrrc', 'pmo', 'admin'];
export const COMMITTEE_ROLES: readonly Role[] = ['ddrrc', 'rdrrc', 'ndrrc'];
export const isRole = (x: unknown): x is Role => typeof x === 'string' && (ROLES as readonly string[]).includes(x);
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
  /** Committee members: the council ('C001', DDRRC) or region ('R-dodoma', RDRRC) they act for. */
  scopeUnitId?: string | null;
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

/** What an institution is told: a request, a due-date reminder or a decision on its submission (DE-07). */
export type NotificationKind = 'request' | 'reminder' | 'decision';
export interface Notification {
  id: string;
  institutionKey: string;
  kind: NotificationKind;
  specId?: string | null;
  requestId?: string | null;
  submissionId?: string | null;
  title: string;
  body?: string | null;
  /** ISO date (yyyy-mm-dd). */
  dueDate?: string | null;
  createdAt: string;
  readAt?: string | null;
  /** E-mail delivery by the Office's sender; 'queued' until it is configured (DE-04). */
  emailStatus: 'queued' | 'sent' | 'failed' | 'none';
}

/** One measured value inside a submission. */
export interface RawEntry {
  unitId: string;
  level: RawLevel;
  value: number | null;
  /** Value that applied before (for the review diff). */
  previous?: number | null;
}

/** 'raw' = measured values in the indicator's unit (default); 'score' = 0–10 scores computed with the INFORM method. */
export type RawValueType = 'raw' | 'score';
/** How deposited scores were computed; only the workbook method is accepted into the Core. */
export type ScoreMethod = 'inform';

export interface RawSubmission {
  id: string;
  specId: string;
  institutionKey?: string | null;
  requestId?: string | null;
  entries: RawEntry[];
  /** Missing on submissions stored before score deposits existed: measured values. */
  valueType?: RawValueType;
  method?: string | null;
  /** Citable source (required for score deposits). */
  source?: string | null;
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
  valueType?: RawValueType;
  method?: ScoreMethod;
  source?: string;
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
/* ------------------------------------------------------------------------------------------------ */
/* Committee records: content the disaster-management committees own, on a review chain by level     */
/* ------------------------------------------------------------------------------------------------ */

/**
 * What the committees record (decision D8, RACI): DRR capacity arrangements, "Know your risk" guidance
 * statements, hazard event reports, and official warnings transcribed from TMA bulletins.
 */
export type CommitteeKind = 'drr' | 'guidance' | 'event' | 'warning';
export const COMMITTEE_KINDS: readonly CommitteeKind[] = ['drr', 'guidance', 'event', 'warning'];
export type CommitteeLevel = 'council' | 'region' | 'national';
/** Kept for the DRR capacity form. */
export type DrrLevel = 'council' | 'region';
export type DrrFieldKey = 'eprp' | 'aa' | 'ert' | 'rvca' | 'eocc' | 'training' | 'committee' | 'stakeholders' | 'involvement';
export const DRR_FIELD_KEYS: readonly DrrFieldKey[] = ['eprp', 'rvca', 'aa', 'ert', 'eocc', 'training', 'committee', 'stakeholders', 'involvement'];
/** The arrangements the engine scores as DRM arrangements in place (institutional.ts), and the committee criteria. */
export const DRR_ARRANGEMENT_KEYS: readonly DrrFieldKey[] = ['eprp', 'rvca', 'ert', 'eocc', 'training'];
export const DRR_COMMITTEE_KEYS: readonly DrrFieldKey[] = ['committee', 'stakeholders', 'involvement'];
/** true = in place (or met), false = not in place (not met), null/absent = not known (not assessed). */
export interface DrrFields {
  eprp?: boolean | null;
  aa?: boolean | null;
  ert?: boolean | null;
  rvca?: boolean | null;
  eocc?: boolean | null;
  /** DRR training delivered to the disaster management committee. */
  training?: boolean | null;
  /** Committee criteria (governance): active; collaborates with stakeholders; involved in DRR issues. */
  committee?: boolean | null;
  stakeholders?: boolean | null;
  involvement?: boolean | null;
  eprpYear?: number | null;
  rvcaYear?: number | null;
}
/** A "Know your risk" statement: the area within the council, the risk, what helps; English and Kiswahili. */
export interface GuidancePayload {
  area: { en: string; sw: string };
  risk: { en: string; sw: string };
  advice: { en: string; sw: string };
  /** Index of the guide-book row this statement replaces, or null for a new statement. */
  replaces?: number | null;
  /**
   * 'vc' marks the national action library: risk-reducing actions per indicator group (PMO-DMD drafts, the
   * NDRRC reviews); 'action' one row of the risk-communication library: an impact and its actions for a hazard
   * (the record's `hazard`) or a group (`group`) at a level, or at every level when `level` is null, standing
   * in place of the guide book's row `replaces` or added after the book's rows (docs/RISK_COMMUNICATION_DESIGN.md).
   */
  topic?: 'hazard' | 'vc' | 'action';
  /** Action library: the INFORM group ('hazard:flood', 'coping:wash'). */
  group?: string;
  /** Risk-communication row: the level it holds at (1 yellow, 2 orange, 3 red), or null for every level. */
  level?: 1 | 2 | 3 | null;
  /** Risk-communication row: what people may see, and what to do, in both languages. */
  impact?: { en: string; sw: string };
  actions?: { en: string[]; sw: string[] };
  /** Action library: the lead sectors PMO-DMD chose (keys of src/features/guide/sectors.ts); `leadSector` is the older single authority. */
  leadSectors?: string[];
  leadSector?: string | null;
}
/** A hazard event report: when, what, and its impacts. */
export interface EventPayload {
  date: string;
  description: string;
  deaths?: number | null;
  injured?: number | null;
  affected?: number | null;
  displaced?: number | null;
}
/** An official warning: level, areas, issuer and bulletin; validity is on the record. */
export interface WarningPayload {
  alertLevel: 1 | 2 | 3;
  /** Unit ids the warning applies to: councils, regions or 'TZ'. */
  areas: string[];
  issuer: string;
  bulletin?: string | null;
  title?: string | null;
}
export type CommitteePayload = DrrFields | GuidancePayload | EventPayload | WarningPayload;

export interface CommitteeRecord {
  id: string;
  kind: CommitteeKind;
  unitId: string;
  level: CommitteeLevel;
  unitName: string;
  region: string;
  /** The region's id ('R-dodoma'); for a region record the unit itself; null for national records. */
  regionId: string | null;
  /** Guide hazard key (guidance, events, warnings). */
  hazard?: string | null;
  payload: CommitteePayload;
  /** What the record rests on (document, minutes, letter, bulletin). */
  source: string;
  note?: string | null;
  /** Warnings: validity (ISO dates); open-ended when `validTo` is null. */
  validFrom?: string | null;
  validTo?: string | null;
  authorId?: string | null;
  authorName: string;
  authorRole?: Role | null;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  reviewNote?: string | null;
}
export interface NewCommitteeRecord {
  kind: CommitteeKind;
  unitId: string;
  level: CommitteeLevel;
  unitName: string;
  region: string;
  regionId: string | null;
  hazard?: string | null;
  payload: CommitteePayload;
  source: string;
  note?: string;
  validFrom?: string | null;
  validTo?: string | null;
}

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
  /** The viewer's institution's notifications (every institution's for reviewers), newest first. */
  listNotifications(viewer: Profile): Promise<Notification[]>;
  markNotificationRead(id: string, viewer: Profile): Promise<void>;
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
  /** Set a user's role, institution and area scope (administrators only). */
  updateProfile(id: string, patch: { role?: Role; institutionKey?: string | null; scopeUnitId?: string | null }): Promise<void>;
  /** Committee records: approved ones for everyone, pending and rejected ones for those concerned. */
  listCommitteeRecords(): Promise<CommitteeRecord[]>;
  submitCommittee(input: NewCommitteeRecord, author: Profile): Promise<CommitteeRecord>;
  /** Approve or reject a pending record; an approved warning may be withdrawn (rejected). */
  reviewCommittee(id: string, decision: 'approved' | 'rejected', reviewer: Profile, note?: string): Promise<void>;
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

/** Committee members and reviewers work at the committee desk. */
export const canRecordCommittee = (role: Role | undefined | null) => role === 'ddrrc' || role === 'rdrrc' || role === 'ndrrc' || canReview(role);

/**
 * Who may record what (mirrors app.can_record_committee): warnings only the NDRRC, PMO-DMD and
 * administrators; otherwise PMO-DMD, administrators and the NDRRC anywhere, an RDRRC within its region
 * (the region and its councils), a DDRRC for its council only; national content never by a DDRRC or RDRRC.
 */
export function canSubmitCommittee(profile: Profile | null | undefined, target: { kind: CommitteeKind; unitId: string; level: CommitteeLevel; regionId: string | null }): boolean {
  if (!profile) return false;
  if (target.kind === 'warning') return profile.role === 'ndrrc' || canReview(profile.role);
  if (canReview(profile.role) || profile.role === 'ndrrc') return true;
  if (target.level === 'national') return false;
  if (profile.role === 'rdrrc') return !!profile.scopeUnitId && profile.scopeUnitId === target.regionId;
  if (profile.role === 'ddrrc') return target.level === 'council' && !!profile.scopeUnitId && profile.scopeUnitId === target.unitId;
  return false;
}

/**
 * Who decides (mirrors review_committee_record): council records the RDRRC of the region, region records
 * the NDRRC, national records PMO-DMD (national vulnerability-and-coping guidance the NDRRC); PMO-DMD and
 * administrators any; committee members never their own report. Warnings are published on entry and may
 * be withdrawn by the NDRRC, PMO-DMD or an administrator.
 */
export function canReviewCommittee(
  profile: Profile | null | undefined,
  record: Pick<CommitteeRecord, 'kind' | 'level' | 'regionId'> & { authorId?: string | null; payload?: CommitteePayload },
): boolean {
  if (!profile) return false;
  if (canReview(profile.role)) return true;
  if (record.kind === 'warning') return profile.role === 'ndrrc';
  if (record.authorId && record.authorId === profile.id) return false;
  if (record.level === 'council') return profile.role === 'rdrrc' && !!profile.scopeUnitId && profile.scopeUnitId === record.regionId;
  if (record.level === 'region') return profile.role === 'ndrrc';
  const topic = record.kind === 'guidance' ? (record.payload as GuidancePayload | undefined)?.topic : undefined;
  return (topic === 'vc' || topic === 'action') && profile.role === 'ndrrc';
}

/** The latest approved record of a kind for an area, if any. */
export function latestApproved(records: readonly CommitteeRecord[], kind: CommitteeKind, unitId: string): CommitteeRecord | null {
  let best: CommitteeRecord | null = null;
  for (const r of records) {
    if (r.kind !== kind || r.unitId !== unitId || r.status !== 'approved') continue;
    if (!best || (r.reviewedAt ?? r.createdAt) > (best.reviewedAt ?? best.createdAt)) best = r;
  }
  return best;
}

/** The DRR arrangements the model applies: the latest approved record per area, as flags (null = not known). */
export function approvedDrrByUnit(records: readonly CommitteeRecord[]): Record<string, DrrFields> {
  const out: Record<string, DrrFields> = {};
  for (const unitId of new Set(records.filter((r) => r.kind === 'drr').map((r) => r.unitId))) {
    const best = latestApproved(records, 'drr', unitId);
    if (best) out[unitId] = best.payload as DrrFields;
  }
  return out;
}

/** Is a warning in force on `date` (ISO yyyy-mm-dd)? Open-ended when it has no end. */
export function warningInForce(r: Pick<CommitteeRecord, 'kind' | 'status' | 'validFrom' | 'validTo'>, date: string): boolean {
  if (r.kind !== 'warning' || r.status !== 'approved') return false;
  if (r.validFrom && r.validFrom > date) return false;
  if (r.validTo && r.validTo < date) return false;
  return true;
}

/** Does a warning name this area: the unit itself, its region, or the whole country ('TZ')? */
export function warningCovers(r: Pick<CommitteeRecord, 'payload'>, unit: { id: string; regionId?: string | null; councilIds?: readonly string[] }): boolean {
  const areas = (r.payload as WarningPayload).areas ?? [];
  if (areas.includes('TZ') || areas.includes(unit.id)) return true;
  if (unit.regionId && areas.includes(unit.regionId)) return true;
  return !!unit.councilIds?.some((id) => areas.includes(id));
}

/** The warnings in force for an area today, highest level first. */
export function activeWarnings(records: readonly CommitteeRecord[], unit: { id: string; regionId?: string | null; councilIds?: readonly string[] }, date = new Date().toISOString().slice(0, 10)): CommitteeRecord[] {
  return records
    .filter((r) => warningInForce(r, date) && warningCovers(r, unit))
    .sort((a, b) => ((b.payload as WarningPayload).alertLevel ?? 0) - ((a.payload as WarningPayload).alertLevel ?? 0) || (b.validFrom ?? '').localeCompare(a.validFrom ?? ''));
}

/** A request is overdue when nothing has been sent back by its due date. */
export function isOverdue(r: Pick<DataRequest, 'status' | 'dueDate'>, today = new Date()): boolean {
  if (!r.dueDate || r.status !== 'open') return false;
  return r.dueDate < today.toISOString().slice(0, 10);
}
