-- E2: לוג הרצות של אוטומציות, ספירת כשלים רצופים בסנכרון Google, והתראה
-- (PRD §9.2: "כל הרצה כותבת שורה לטבלה job_runs")

create table public.job_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- שם העבודה, למשל 'google-sync'. עבודות עתידיות: 'reminders', 'recurring-tasks'
  job text not null check (char_length(job) between 1 and 50),
  -- מה הפעיל: 'manual' (כפתור), 'background' (הדפדפן), 'after-save', 'cron'
  trigger text not null check (trigger in ('manual', 'background', 'after-save', 'cron')),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  status text not null check (status in ('ok', 'error')),
  changed integer,
  error text check (char_length(error) <= 1000)
);

create index job_runs_user_started_idx on public.job_runs (user_id, started_at desc);

-- נכתב רק מהשרת (service role). המשתמשת רואה את ההרצות שלה בלבד
alter table public.job_runs enable row level security;

create policy job_runs_select_own on public.job_runs
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.job_runs from anon;
revoke insert, update, delete on public.job_runs from authenticated;

-- כשלים רצופים: אחרי 3 הסנכרון מאט, ונשלחת התראה אחת לכל רצף
alter table public.calendar_connections
  add column consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  add column failure_alert_sent_at timestamptz;

drop view public.calendar_connection_status;

create view public.calendar_connection_status as
select
  user_id,
  google_email,
  calendar_id,
  calendar_name,
  calendar_selected_at,
  last_synced_at,
  last_sync_attempt_at,
  last_sync_error,
  consecutive_failures,
  created_at
from public.calendar_connections
where user_id = auth.uid();

revoke all on public.calendar_connection_status from anon;
grant select on public.calendar_connection_status to authenticated;
