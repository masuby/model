# Deployment

INFORM Tanzania is a static single-page app. **Vercel** is the single production host
(`inform.co.tz`); GitHub Actions (`.github/workflows/ci.yml`) is the quality gate.

## 1. Vercel (web app)

1. Import the GitHub repository in Vercel (framework preset **Vite**; `vercel.json` sets the build
   command, output directory, SPA rewrites, security headers and caching).
2. Production branch: `main`. Every pull request gets a preview deployment automatically.
3. Domain: add `inform.co.tz` (and `www`) in *Project → Settings → Domains* and point DNS as instructed.
   Today `www.inform.co.tz` is the primary domain and `inform.co.tz` redirects to it, so the site (and
   every magic link) runs on `https://www.inform.co.tz`.
4. Environment variables (only if using the shared backend — see §2), for *Production*, *Preview* and
   *Development* (set on 2026-09-26):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   Vite inlines them at build time: **redeploy** after changing them.

The footer shows the deployed commit and build time (`build <sha> · <time>`) so anyone can confirm
what is live.

## 2. Supabase (shared Data portal)

Production project: **inform-tanzania** (ref `eovhjdkwtxuidndypozp`, region `eu-west-1`,
URL `https://eovhjdkwtxuidndypozp.supabase.co`). Migrations `0001`–`0003` are applied and the role model
was verified end-to-end against it (sector / reviewer / admin / anonymous — 15/15 checks).

Without Supabase keys the Data portal runs in demo mode (browser-local). To set up a new environment:

1. Create a project (region close to users; `eu-west-1` or `ap-south-1` are reasonable from Tanzania).
2. Apply `supabase/migrations/0001_init.sql`, `0002_harden.sql` and `0003_fix_profile_policy_and_grants.sql`
   in order (SQL editor, or `supabase db push` with the CLI).
3. *Authentication → URL configuration*: magic links return to `<the page's own origin>/data`, so the
   allow-list must contain every origin people sign in from:
   - Site URL: `https://www.inform.co.tz` (the primary domain, see §1.3)
   - Redirect URLs: `https://www.inform.co.tz/data`, `https://inform.co.tz/data`,
     `https://*-masubis-projects.vercel.app/data` (previews) and `http://localhost:5174/data` (local dev).
4. *Authentication → Emails → SMTP settings*: configure a custom SMTP provider (e.g. Resend, Postmark,
   Amazon SES) before inviting officers. Supabase's built-in sender is only for testing: it sends a few
   emails per hour and **only to members of the Supabase organisation**, so sign-in links and invites to
   anyone else never arrive.
5. Copy the project URL and the **publishable (anon) key** into Vercel (§1.4). Never expose the
   service-role key to the browser.
6. Create accounts by inviting users (*Authentication → Users → Invite*). New users start as `viewer`.
   Promote them in the SQL editor:
   ```sql
   update public.profiles set role = 'sector', institution = 'TMA' where id = '<user uuid>';
   update public.profiles set role = 'pmo' where id = '<reviewer uuid>';
   ```
7. Run the Security Advisor in the Supabase dashboard; the schema enables RLS on every table. The two
   remaining advisor notes (`review_submission`, `revert_value` executable by signed-in users) are
   intentional: they are the approval API and re-check the caller's role server-side.
8. Regenerate `src/data-layer/database.types.ts` after any schema change
   (`npx supabase gen types typescript --project-id <ref>`).

### Roles

| Role | Can |
|---|---|
| viewer | read approved values (same as the public) |
| sector | submit changes; see own submissions |
| pmo | review (approve/reject) all submissions, revert values, read the audit log |
| admin | as pmo, plus manage roles |

Approvals run in the `review_submission` database function (security definer), which re-checks the
caller's role server-side and writes values and the audit entry atomically.

## 3. Local development

```bash
npm install
cp .env.example .env.local   # optional: add Supabase keys
npm run dev                  # http://localhost:5174
npm run check                # typecheck + lint + tests
```
