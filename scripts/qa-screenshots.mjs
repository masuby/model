/**
 * qa-screenshots.mjs — visual QA: full-page screenshots of every route in day/night and English/Kiswahili
 * at phone, tablet and desktop widths, plus any console errors. Requires a running dev or preview server.
 *
 *   npx playwright install chromium          (once)
 *   node scripts/qa-screenshots.mjs [baseUrl] [outDir] [--only=/explore,/area/C041] [--themes=dark] [--langs=en] [--widths=1440]
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1].split(',') : def;
};
const positional = args.filter((a) => !a.startsWith('--'));
const BASE = positional[0] ?? 'http://localhost:5174';
const OUT = positional[1] ?? 'qa-screenshots';
const ROUTES = flag('only', ['/', '/explore', '/area/C041', '/area/R-kigoma', '/insights', '/severity', '/learn', '/learn/risk', '/methodology', '/data', '/does-not-exist']);
const THEMES = flag('themes', ['light', 'dark']);
const LANGS = flag('langs', ['en', 'sw']);
const WIDTHS = flag('widths', ['1440', '390']).map(Number);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const report = [];

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    for (const lang of LANGS) {
      const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: theme });
      await ctx.addInitScript(
        ([t, l]) => localStorage.setItem('inform.prefs', JSON.stringify({ state: { theme: t, language: l, learnProgress: {} }, version: 1 })),
        [theme, lang],
      );
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      for (const route of ROUTES) {
        errors.length = 0;
        const t0 = Date.now();
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 90_000 }).catch((e) => errors.push(`goto: ${e.message}`));
        await page.waitForTimeout(1200);
        // Trigger scroll-in animations, then return to the top.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 220));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(600);
        const name = `${route === '/' ? 'home' : route.slice(1).replace(/[/?=&]/g, '_')}-${width}-${theme}-${lang}.png`;
        await page.screenshot({ path: path.join(OUT, name), fullPage: true });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        report.push({ route, width, theme, lang, ms: Date.now() - t0, horizontalOverflow: overflow > 1 ? overflow : 0, errors: [...errors] });
      }
      await ctx.close();
    }
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.errors.length || r.horizontalOverflow);
console.log(`${report.length} screenshots → ${OUT}`);
for (const r of bad) console.log(`! ${r.route} ${r.width} ${r.theme} ${r.lang}  overflow=${r.horizontalOverflow}  ${r.errors.join(' | ')}`);
