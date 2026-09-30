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
4. Environment variables (only if using the shared backend, see §2), for *Production*, *Preview* and
   *Development* (set on 2026-09-26):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   Vite inlines them at build time: **redeploy** after changing them.

The footer shows the deployed commit and build time (`build <sha> · <time>`) so anyone can confirm
what is live.

## 2. Supabase (shared Data portal)

Production project: **inform-tanzania** (ref `eovhjdkwtxuidndypozp`, region `eu-west-1`,
URL `https://eovhjdkwtxuidndypozp.supabase.co`). Migrations `0001` to `0005` are applied. The role model
was verified end-to-end against it (sector / reviewer / admin / anonymous, 15/15 checks), and the
institutional data workflow (`0004`, `0005`) with rolled-back dry runs before each was applied.

Without Supabase keys the Data portal runs in demo mode (browser-local). To set up a new environment:

1. Create a project (region close to users; `eu-west-1` or `ap-south-1` are reasonable from Tanzania).
2. Apply every file in `supabase/migrations/` in order (SQL editor, or `supabase db push` with the CLI):
   - `0001_init.sql`, `0002_harden.sql`, `0003_fix_profile_policy_and_grants.sql`: accounts, roles,
     direct 0–10 score submissions, approval and the audit log.
   - `0004_data_workflow.sql`: the institutional data workflow (institutions, the indicator list,
     indicator assignments, update and validation requests, measured-value submissions and approved
     values, validations) and `profiles.institution_key`.
   - `0005_one_live_request.sql`: a new request replaces the indicator's open request of the same kind.
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
   Promote the first administrator once in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where id = '<your user uuid>';
   ```
   From then on administrators manage everyone in *Data portal → People*: each person's role and, for
   sector officers, the institution they enter data for. (The same in SQL:
   `update public.profiles set role = 'sector', institution_key = 'NBS' where id = '<user uuid>';`.)
7. Run the Security Advisor in the Supabase dashboard; the schema enables RLS on every table. The
   notes that signed-in users can execute security-definer functions are intentional: those functions
   are the workflow API (`review_submission`, `revert_value`, `assign_indicators`, `create_requests`,
   `close_request`, `submit_raw_values`, `review_raw_submission`, `confirm_values`,
   `revert_raw_value`) and each re-checks the caller's role and institution server-side. Do enable
   *Authentication → Leaked password protection* (the one other note).
8. Regenerate `src/data-layer/database.types.ts` after any schema change
   (`npx supabase gen types typescript --project-id <ref>`).

### Roles

| Role | Can |
|---|---|
| viewer | read approved values (same as the public) |
| sector | enter measured values for the indicators assigned to their institution, confirm current values, see own submissions |
| pmo | assign indicators to institutions, send update and validation requests, review (approve/reject) every submission, enter values directly, revert values, read the audit log |
| admin | as pmo, plus manage people: roles and institutions |

Approvals run in database functions (security definer): `review_submission` for direct 0–10 scores and
`review_raw_submission` for measured values. Each re-checks the caller's role server-side and writes the
values, the request status and the audit entry atomically.

### The institutional data workflow

1. An administrator links each sector officer to their institution (*People*).
2. A reviewer gives every indicator a responsible institution (*Indicators*; "Suggest owners" assigns
   each one to the institution named in its specification or the usual source of its indicator group).
3. Reviewers select indicators and send an update or validation request with a due date and a message.
4. The institution sees its indicators and open requests, and enters figures in their natural units for
   the whole country, any region and any council, typed or pasted from a spreadsheet, naming the
   dataset. It can also confirm that the current values still hold.
5. A reviewer approves or rejects each submission, seeing today's value, the proposal, the 0–10 scores
   and the councils whose scores would move.
6. For each council the most local figure applies (council, else its region, else the country, else the
   INFORM baseline), and every indicator group with a new figure is recomputed. Area profiles list the
   figures behind each recomputed score with the level they were recorded at.

## 3. Local development

```bash
npm install
cp .env.example .env.local   # optional: add Supabase keys
npm run dev                  # http://localhost:5174
npm run dev:demo             # http://localhost:5175, browser-only demo even when .env.local has keys
npm run check                # typecheck + lint + tests
```
