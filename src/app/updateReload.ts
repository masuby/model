/**
 * After a deploy, a tab opened on the previous version still points at code files that no longer exist
 * on the server, so opening another page fails ("Failed to fetch dynamically imported module"). Reload
 * once to pick up the new version. The time guard stops a reload loop when the failure has another cause.
 */
const KEY = 'inform.updateReload';
const GUARD_MS = 60_000;

const STALE_CODE = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export function isStaleCodeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return STALE_CODE.test(message);
}

/** Reload the page, at most once a minute. Returns false when a reload was attempted too recently. */
export function reloadForUpdate(): boolean {
  try {
    if (Date.now() - Number(sessionStorage.getItem(KEY) ?? 0) < GUARD_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Vite reports failed code-file loads (lazy pages, charts, maps) through this event. */
export function installUpdateReload(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForUpdate()) event.preventDefault();
  });
}
