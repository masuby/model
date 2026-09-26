/**
 * qa-a11y.mjs — axe-core accessibility audit (WCAG 2.1 A/AA) of every route in day and night mode.
 *   node scripts/qa-a11y.mjs [baseUrl]
 */
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const ROUTES = ['/', '/explore', '/area/C041', '/insights', '/severity', '/learn', '/learn/risk', '/methodology', '/data'];
const browser = await chromium.launch();
let total = 0;
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  await ctx.addInitScript((t) => localStorage.setItem('inform.prefs', JSON.stringify({ state: { theme: t, language: 'en', learnProgress: {} }, version: 1 })), theme);
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('.leaflet-container').analyze();
    const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    total += serious.length;
    for (const v of serious) {
      console.log(`[${theme}] ${route}  ${v.impact}  ${v.id}: ${v.help}  (${v.nodes.length})`);
      for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(' ')}  ${(n.failureSummary || '').split('\n')[1]?.trim() ?? ''}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(total ? `${total} serious/critical rule violations` : 'No serious or critical accessibility violations');
