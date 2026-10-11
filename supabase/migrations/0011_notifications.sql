-- 0011: institutions are told about requests, due dates and decisions (issue DE-07).
--
-- Every data request and every review decision now writes a notification for the institution concerned.
-- The institution's officers see them in the Data portal (the inbox on their Indicators tab) and mark
-- them read; reviewers see all of them. Delivery by e-mail is the step this migration prepares but
-- cannot perform: a Database Webhook on inserts into public.notifications calls an Edge Function that
-- sends the message through the Office's SMTP account (issue DE-04) and sets email_status to 'sent' or
-- 'failed'. Until that is configured every row stays 'queued' and the inbox is the channel.
--
-- Due-date reminders: app.queue_due_reminders(days) writes one reminder per open request due within
-- `days`; schedule it daily with pg_cron (select cron.schedule('inform-reminders', '0 6 * * *',
-- $$select app.queue_due_reminders(3)$$);) once the project has the extension.
--
-- Apply to the live project after 0010.

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  institution_key text not null references public.institutions (key),
  kind            text not null check (kind in ('request', 'reminder', 'decision')),
  spec_id         text references public.indicators (spec_id) on delete cascade,
  request_id      uuid references public.data_requests (id) on delete cascade,
  submission_id   uuid references public.raw_submissions (id) on delete cascade,
  title           text not null check (length(title) <= 300),
  body            text check (body is null or length(body) <= 4000),
  due_date        date,
  created_at      timestamptz not null default now(),
  read_at         timestamptz,
  email_status    text not null default 'queued' check (email_status in ('queued', 'sent', 'failed', 'none')),
  email_error     text
);
create index if not exists notifications_institution_idx on public.notifications (institution_key, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (institution_key) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications: own institution or reviewer" on public.notifications;
create policy "notifications: own institution or reviewer" on public.notifications
  for select to authenticated
  using (institution_key = (select app.current_institution()) or (select app.is_reviewer()));

drop policy if exists "notifications: own institution marks read" on public.notifications;
create policy "notifications: own institution marks read" on public.notifications
  for update to authenticated
  using (institution_key = (select app.current_institution()))
  with check (institution_key = (select app.current_institution()));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- A request is created: tell the institution.
create or replace function app.notify_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare ind_name text;
begin
  select name into ind_name from public.indicators where spec_id = new.spec_id;
  insert into public.notifications (institution_key, kind, spec_id, request_id, title, body, due_date)
  values (
    new.institution_key, 'request', new.spec_id, new.id,
    case when new.kind = 'validate' then 'Please confirm: ' else 'Please update: ' end || coalesce(ind_name, new.spec_id),
    new.message, new.due_date
  );
  return new;
end $$;

drop trigger if exists data_requests_notify on public.data_requests;
create trigger data_requests_notify after insert on public.data_requests
  for each row execute function app.notify_request();

-- A submission is decided: tell the institution that made it.
create or replace function app.notify_decision()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare ind_name text;
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') and new.institution_key is not null then
    select name into ind_name from public.indicators where spec_id = new.spec_id;
    insert into public.notifications (institution_key, kind, spec_id, submission_id, title, body)
    values (
      new.institution_key, 'decision', new.spec_id, new.id,
      coalesce(ind_name, new.spec_id) || ': ' || new.status,
      new.review_note
    );
  end if;
  return new;
end $$;

drop trigger if exists raw_submissions_notify on public.raw_submissions;
create trigger raw_submissions_notify after update of status on public.raw_submissions
  for each row execute function app.notify_decision();

-- Reminders for open requests due within p_days (one per request per week); returns how many were written.
create or replace function app.queue_due_reminders(p_days integer default 3)
returns integer
language plpgsql security definer set search_path = public
as $$
declare n integer := 0;
begin
  insert into public.notifications (institution_key, kind, spec_id, request_id, title, body, due_date)
  select r.institution_key, 'reminder', r.spec_id, r.id,
         'Due ' || to_char(r.due_date, 'DD Mon YYYY') || ': ' || coalesce(i.name, r.spec_id),
         r.message, r.due_date
    from public.data_requests r
    left join public.indicators i on i.spec_id = r.spec_id
   where r.status = 'open'
     and r.due_date is not null
     and r.due_date between current_date and current_date + p_days
     and not exists (
       select 1 from public.notifications n
        where n.request_id = r.id and n.kind = 'reminder' and n.created_at > now() - interval '7 days');
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function app.queue_due_reminders(integer) from public, anon, authenticated;
