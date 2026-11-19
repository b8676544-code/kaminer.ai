-- סכמה ראשונית לפי docs/PRD.md §4: enums, טבלאות, טריגרים, RLS ו-views.

-- ───────────── enums ─────────────
create type public.user_role as enum ('owner', 'freelancer');
create type public.task_category as enum ('marketing', 'business', 'clients', 'personal');
create type public.task_status as enum ('todo', 'in_progress', 'waiting_client', 'done');
create type public.task_priority as enum ('low', 'normal', 'urgent');
create type public.client_status as enum ('active', 'archived');

-- ───────────── helpers ─────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────── profiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'owner',
  created_at timestamptz not null default now()
);

-- יצירת profile אוטומטית לכל משתמש חדש ב-auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── freelancers ─────────────
create table public.freelancers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  email text,
  phone text,
  specialty text,
  default_hourly_cost numeric(10, 2) check (default_hourly_cost >= 0),
  profile_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index freelancers_owner_idx on public.freelancers (owner_id);

-- ───────────── clients ─────────────
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  contact_name text,
  phone text,
  email text,
  notes text,
  status public.client_status not null default 'active',
  hourly_rate numeric(10, 2) check (hourly_rate >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_owner_status_idx on public.clients (owner_id, status);

-- ───────────── task_templates ─────────────
create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  category public.task_category not null,
  default_estimate_minutes integer check (default_estimate_minutes > 0),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index task_templates_owner_idx on public.task_templates (owner_id);

-- ───────────── tasks ─────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  category public.task_category not null,
  client_id uuid references public.clients (id) on delete restrict,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'normal',
  due_date date,
  estimate_minutes integer check (estimate_minutes > 0),
  assignee_freelancer_id uuid references public.freelancers (id) on delete set null,
  freelancer_cost numeric(10, 2) check (freelancer_cost >= 0),
  template_id uuid references public.task_templates (id) on delete set null,
  completed_at timestamptz,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- לקוח חובה בקטגוריית "לקוחות"; משימה אישית בלי לקוח ובלי פרילנסר
  constraint tasks_client_required check (category <> 'clients' or client_id is not null),
  constraint tasks_personal_no_client check (
    category <> 'personal'
    or (client_id is null and assignee_freelancer_id is null and freelancer_cost is null)
  )
);
create index tasks_owner_status_idx on public.tasks (owner_id, status);
create index tasks_client_idx on public.tasks (client_id);
create index tasks_freelancer_idx on public.tasks (assignee_freelancer_id);
create index tasks_due_date_idx on public.tasks (owner_id, due_date);

-- completed_at מתעדכן לפי הסטטוס
create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.set_task_completed_at();

-- ───────────── task_checklist_items ─────────────
create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  is_done boolean not null default false,
  position integer not null default 0
);
create index task_checklist_items_task_idx on public.task_checklist_items (task_id, position);

-- ───────────── task_notes ─────────────
create table public.task_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index task_notes_task_idx on public.task_notes (task_id, created_at);

-- ───────────── meetings ─────────────
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  client_id uuid references public.clients (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  location text,
  notes text,
  google_event_id text,
  google_etag text,
  source text not null default 'app' check (source in ('app', 'google')),
  is_all_day boolean not null default false,
  deleted_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetings_time_order check (ends_at > starts_at)
);
create index meetings_owner_time_idx on public.meetings (owner_id, starts_at);
create unique index meetings_google_event_uidx on public.meetings (owner_id, google_event_id)
  where google_event_id is not null;

-- ───────────── time_entries ─────────────
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer check (duration_minutes >= 0),
  is_manual boolean not null default false,
  is_billable boolean not null default true,
  note text,
  meeting_id uuid references public.meetings (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_end_after_start check (ended_at is null or ended_at >= started_at)
);
create index time_entries_task_idx on public.time_entries (task_id);
create index time_entries_user_started_idx on public.time_entries (user_id, started_at);
-- שעון רץ אחד לכל משתמש
create unique index time_entries_one_running_uidx on public.time_entries (user_id)
  where ended_at is null;

-- ───────────── calendar_connections ─────────────
create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  google_email text,
  calendar_id text not null default 'primary',
  refresh_token text not null, -- מוצפן בצד השרת, לא נחשף ל-client
  sync_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── updated_at triggers ─────────────
create trigger freelancers_updated_at before update on public.freelancers
  for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger task_templates_updated_at before update on public.task_templates
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger meetings_updated_at before update on public.meetings
  for each row execute function public.set_updated_at();
create trigger time_entries_updated_at before update on public.time_entries
  for each row execute function public.set_updated_at();
create trigger calendar_connections_updated_at before update on public.calendar_connections
  for each row execute function public.set_updated_at();

-- ═════════════ RLS ═════════════
alter table public.profiles enable row level security;
alter table public.freelancers enable row level security;
alter table public.clients enable row level security;
alter table public.task_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_notes enable row level security;
alter table public.meetings enable row level security;
alter table public.time_entries enable row level security;
alter table public.calendar_connections enable row level security;

-- profiles: קריאה ועדכון של עצמי בלבד (התפקיד לא ניתן לשינוי מה-client)
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- טבלאות בבעלות: הכול כש-owner_id = המשתמשת
create policy freelancers_owner_all on public.freelancers
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy clients_owner_all on public.clients
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy task_templates_owner_all on public.task_templates
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy meetings_owner_all on public.meetings
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- tasks: של הבעלים, ומשימה אישית רק ליוצרת שלה.
-- לקוח, פרילנסר ותבנית חייבים להיות של אותה בעלים.
create policy tasks_owner_all on public.tasks
  for all to authenticated
  using (
    owner_id = (select auth.uid())
    and (category <> 'personal' or created_by = (select auth.uid()))
  )
  with check (
    owner_id = (select auth.uid())
    and created_by = (select auth.uid())
    and (client_id is null or exists (
      select 1 from public.clients c where c.id = client_id and c.owner_id = (select auth.uid())))
    and (assignee_freelancer_id is null or exists (
      select 1 from public.freelancers f where f.id = assignee_freelancer_id and f.owner_id = (select auth.uid())))
    and (template_id is null or exists (
      select 1 from public.task_templates t where t.id = template_id and t.owner_id = (select auth.uid())))
  );

-- טבלאות בנות: דרך הרשאת המשימה האב (ה-RLS של tasks חל בתוך ה-exists)
create policy task_checklist_items_via_task on public.task_checklist_items
  for all to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id))
  with check (exists (select 1 from public.tasks t where t.id = task_id));

create policy task_notes_via_task on public.task_notes
  for all to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id))
  with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.tasks t where t.id = task_id)
  );

create policy time_entries_via_task on public.time_entries
  for all to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.tasks t where t.id = task_id)
  );

-- calendar_connections: אין policy, כלומר אין גישה מה-client. רק service role.
revoke all on public.calendar_connections from anon, authenticated;

-- ═════════════ views ═════════════
-- security_invoker: ה-views מכבדים את ה-RLS של המשתמשת שקוראת

create view public.task_time_summary with (security_invoker = true) as
select
  t.id as task_id,
  t.estimate_minutes,
  coalesce(sum(te.duration_minutes), 0)::integer as actual_minutes,
  case
    when t.estimate_minutes is null or t.estimate_minutes = 0 then null
    else round(100.0 * (coalesce(sum(te.duration_minutes), 0) - t.estimate_minutes) / t.estimate_minutes, 1)
  end as overrun_percent
from public.tasks t
left join public.time_entries te on te.task_id = t.id and te.ended_at is not null
group by t.id, t.estimate_minutes;

-- שעות לפי לקוח וחודש (Asia/Jerusalem). כל הקטגוריות העסקיות, בלי אישיות.
create view public.client_monthly_hours with (security_invoker = true) as
select
  t.client_id,
  date_trunc('month', te.started_at at time zone 'Asia/Jerusalem')::date as month,
  sum(te.duration_minutes)::integer as total_minutes,
  sum(te.duration_minutes) filter (where te.is_billable)::integer as billable_minutes
from public.time_entries te
join public.tasks t on t.id = te.task_id
where t.client_id is not null
  and t.category <> 'personal'
  and te.ended_at is not null
group by t.client_id, date_trunc('month', te.started_at at time zone 'Asia/Jerusalem');

-- סטטוס חיבור Google בלי טוקנים. security definer (ברירת מחדל של view) כדי לעקוף
-- את חסימת הטבלה, ומסונן ידנית למשתמשת המחוברת.
create view public.calendar_connection_status as
select user_id, google_email, calendar_id, last_synced_at, created_at
from public.calendar_connections
where user_id = auth.uid();

revoke all on public.calendar_connection_status from anon;
grant select on public.calendar_connection_status to authenticated;
