/**
 * overrideStore — local persistence for INFORM data edits, with a simple
 * approval flow. PMO/Admin edits are applied directly; Sector edits become
 * pending submissions a PMO approves. Approved/PMO edits are merged into the
 * dataset (riskModel) so the whole system — map, charts, tables — reflects them.
 *
 * Storage is this browser's localStorage (single-device). Cross-device, real
 * multi-user persistence is the Supabase backend (supabase/setup.sql) — when a
 * project exists, swap these read/write calls for Supabase queries.
 */
const LS_OVR = 'inform_overrides_v1';   // { adm2Code: { hazard, vuln, cope, _by, _ts } }
const LS_PEND = 'inform_pending_v1';    // [ { id, code, name, region, hazard, vuln, cope, by, ts } ]
const hasLS = typeof localStorage !== 'undefined';

const read = (k, fallback) => {
  if (!hasLS) return fallback;
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
};
const write = (k, v) => { if (hasLS) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore quota */ } } };

export const getOverrides = () => read(LS_OVR, {});
export const getPending = () => read(LS_PEND, []);

// Apply a confirmed edit (PMO/Admin direct, or an approved submission).
export function saveDirect(code, vals, who) {
  const o = getOverrides();
  o[code] = { ...(o[code] || {}), ...vals, _by: who, _ts: Date.now() };
  write(LS_OVR, o);
}

// Queue a Sector edit for PMO approval.
export function submit(entry) {
  const p = getPending();
  p.push({ id: `${entry.code}-${p.length}-${Date.now()}`, status: 'pending', ts: Date.now(), ...entry });
  write(LS_PEND, p);
}

export function approve(id) {
  const p = getPending();
  const e = p.find((x) => x.id === id);
  if (e) {
    saveDirect(e.code, { hazard: e.hazard, vuln: e.vuln, cope: e.cope, ind: e.ind, exposure: e.exposure, indSrc: e.indSrc, expSrc: e.expSrc }, `PMO — approved (${e.by || 'sector'})`);
    write(LS_PEND, p.filter((x) => x.id !== id));
  }
}

export function reject(id) {
  write(LS_PEND, getPending().filter((x) => x.id !== id));
}

export function clearOverride(code) {
  const o = getOverrides();
  delete o[code];
  write(LS_OVR, o);
}

export function resetAll() { write(LS_OVR, {}); write(LS_PEND, []); }

export const editCount = () => Object.keys(getOverrides()).length;
