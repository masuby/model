# Deployment

INFORM Tanzania is a static single-page app. **Vercel** is the single production host
(`inform.co.tz`); GitHub Actions (`.github/workflows/ci.yml`) is the quality gate.

## 1. Vercel (web app)

1. Import the GitHub repository in Vercel (framework preset **Vite**; `vercel.json` sets the build
   command, output directory, SPA rewrites, security headers and caching).
2. Production branch: `main`. Every pull request gets a preview deployment automatically.
3. Domain: add `inform.co.tz` (and `www`) in *Project → Settings → Domains* and point DNS as instructed.
4. Environment variables (only if using the shared backend — see §2), for *Production* and *Preview*:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   Vite inlines them at build time: **redeploy** after changing them.

The footer shows the deployed commit and build time (`build <sha> · <time>`) so anyone can confirm
what is live.

## 2. Supabase (shared Data portal — optional)

Without Supabase the Data portal runs in demo mode (browser-local). To enable real multi-user data:

1. Create a project (region close to users; `eu-west-1` or `ap-south-1` are reasonable from Tanzania).
2. Open *SQL editor* and run `supabase/migrations/0001_init.sql` (idempotent), or with the CLI:
   `supabase db push`.
3. *Authentication → URL configuration*: set the Site URL to `https://inform.co.tz` and add
   `https://inform.co.tz/data` (and your preview URL pattern) to the redirect allow-list — magic links
   return to `/data`.
4. Copy the project URL and the **publishable (anon) key** into Vercel (§1.4). Never expose the
   service-role key to the browser.
5. Create accounts by inviting users (*Authentication → Users → Invite*). New users start as `viewer`.
   Promote them in the SQL editor:
   ```sql
   update public.profiles set role = 'sector', institution = 'TMA' where id = '<user uuid>';
   update public.profiles set role = 'pmo' where id = '<reviewer uuid>';
   ```
6. Run the Security Advisor in the Supabase dashboard; the schema enables RLS on every table.

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
