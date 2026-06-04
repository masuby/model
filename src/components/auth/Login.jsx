import React, { useState, useEffect } from "react";
import "./Login.css";

// Soft access gate for the INFORM Tanzania portal. The expected password is stored ONLY as a SHA-256 hash
// (never plaintext in the source). Override at deploy time with the Vercel env var VITE_LOGIN_SHA256
// (= SHA-256 hex of your chosen password). Default below = the hash of the interim password.
// NOTE: this is a client-side gate — it deters casual access but is not strong security (the app bundle is
// still downloaded). For enforced protection use Vercel Deployment Protection (password at the edge).
const DEFAULT_HASH = "584491a352490e2d4a4ef5f276ced766d6fed4eb12867717fe3f59fb59c99fcf"; // INFORM2026
const PASS_HASH = (import.meta.env.VITE_LOGIN_SHA256 || DEFAULT_HASH).toLowerCase();
const KEY = "inform_auth";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isAuthed() {
  try { return localStorage.getItem(KEY) === PASS_HASH; } catch { return false; }
}
export function logout() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  window.location.reload();
}

export default function Login({ onAuth }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Sign in · INFORM Tanzania"; }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const hash = await sha256(pw);
    if (hash === PASS_HASH) {
      try { localStorage.setItem(KEY, hash); } catch (e2) { /* ignore */ }
      onAuth();
    } else {
      setErr("Incorrect password. Please try again.");
      setPw("");
    }
    setBusy(false);
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">INFORM <span>Tanzania</span></div>
        <div className="login-sub">Subnational Disaster Risk Portal</div>
        <label className="login-label" htmlFor="pw">Password</label>
        <input
          id="pw" type="password" className="login-input" value={pw} autoFocus
          onChange={(e) => setPw(e.target.value)} placeholder="Enter access password"
          autoComplete="current-password"
        />
        {err && <div className="login-err">{err}</div>}
        <button className="login-btn" type="submit" disabled={busy || !pw}>
          {busy ? "Checking…" : "Sign in"}
        </button>
        <div className="login-foot">Authorised access only · Prime Minister's Office – DMD</div>
      </form>
    </div>
  );
}
