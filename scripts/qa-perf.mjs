/**
 * qa-perf.mjs - page-load performance on a production build, emulating a mid-range phone on 4G
 * (4× CPU slowdown, ~9 Mbps / 60 ms RTT). Reports FCP, LCP, total blocking time proxy, JS bytes.
 *   npx vite build && npx vite preview --port 4173
 *   node scripts/qa-perf.mjs [baseUrl] [--runs=3] [--only=/severity,/]
 */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:4173';
const RUNS = Number((args.find((a) => a.startsWith('--runs=')) ?? '--runs=3').split('=')[1]);
const ONLY = args.find((a) => a.startsWith('--only='));
const ROUTES = ONLY ? ONLY.slice(7).split(',') : ['/', '/explore', '/area/C041', '/insights', '/severity', '/learn', '/methodology', '/data'];

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// Full Chromium (new headless) records paint timings; the minimal headless shell does not.
const browser = await chromium.launch({ channel: 'chromium' });
const rows = [];
for (const route of ROUTES) {
  const samples = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let jsBytes = 0;
    let allBytes = 0;
    const jsIds = new Set();
    cdp.on('Network.responseReceived', (e) => {
      if (e.type === 'Script') jsIds.add(e.requestId);
    });
    cdp.on('Network.loadingFinished', (e) => {
      allBytes += e.encodedDataLength;
      if (jsIds.has(e.requestId)) jsBytes += e.encodedDataLength;
    });
    await page.addInitScript(() => {
      window.__lcp = 0;
      window.__longTasks = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__longTasks += Math.max(0, e.duration - 50);
      }).observe({ type: 'longtask', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    // "Content visible" = the page's own heading has rendered (not the shell or a loader).
    await page.waitForSelector('main h1, main h2', { timeout: 60_000 });
    const content = Date.now() - t0;
    await page.waitForLoadState('networkidle', { timeout: 120_000 });
    const load = Date.now() - t0;
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
      lcp: window.__lcp,
      tbt: window.__longTasks,
    }));
    samples.push({ ...m, content, load, jsKB: Math.round(jsBytes / 1024), totalKB: Math.round(allBytes / 1024) });
    await ctx.close();
  }
  const row = {
    route,
    fcp: Math.round(median(samples.map((s) => s.fcp))),
    lcp: Math.round(median(samples.map((s) => s.lcp))),
    tbt: Math.round(median(samples.map((s) => s.tbt))),
    content: Math.round(median(samples.map((s) => s.content))),
    idle: Math.round(median(samples.map((s) => s.load))),
    jsKB: median(samples.map((s) => s.jsKB)),
    totalKB: median(samples.map((s) => s.totalKB)),
  };
  rows.push(row);
  console.log(`${route.padEnd(14)} FCP ${String(row.fcp).padStart(5)} ms   LCP ${String(row.lcp).padStart(5)} ms   content ${String(row.content).padStart(5)} ms   TBT ${String(row.tbt).padStart(5)} ms   idle ${String(row.idle).padStart(6)} ms   JS ${row.jsKB} KB   total ${row.totalKB} KB`);
}
await browser.close();
