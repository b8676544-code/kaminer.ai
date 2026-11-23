-- ═════════════ אנשי קשר ללקוח, פרויקטים ותמחור ═════════════

-- ───────────── לקוח: נייד ─────────────
alter table public.clients add column mobile text;

-- ───────────── אנשי קשר נוספים ─────────────
create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  role text,
  mobile text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_contacts_client_idx on public.client_contacts (client_id);

create trigger client_contacts_updated_at before update on public.client_contacts
  for each row execute function public.set_updated_at();

alter table public.client_contacts enable row level security;

create policy client_contacts_owner_all on public.client_contacts
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = (select auth.uid()))
  );

-- ───────────── תמחור: סוג משותף לפרויקט ולמשימה ─────────────
create type public.pricing_type as enum ('hourly', 'fixed');
create type public.project_status as enum ('active', 'done', 'archived');

-- ───────────── פרויקטים ─────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  description text,
  status public.project_status not null default 'active',
  start_date date,
  end_date date,
  pricing_type public.pricing_type,
  hourly_rate numeric(10, 2) check (hourly_rate >= 0),
  final_price numeric(10, 2) check (final_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_order check (end_date is null or start_date is null or end_date >= start_date),
  -- תעריף רק בתמחור לפי שעה; מחיר חובה בתמחור גלובלי; בלי סוג תמחור אין מחיר
  constraint projects_pricing_rules check (
    (pricing_type = 'hourly' or hourly_rate is null)
    and (pricing_type <> 'fixed' or final_price is not null)
    and (pricing_type is not null or final_price is null)
  )
);
create index projects_client_idx on public.projects (client_id);
create index projects_owner_status_idx on public.projects (owner_id, status);

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy projects_owner_all on public.projects
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = (select auth.uid()))
  );

-- ───────────── משימות: פרויקט ותמחור ─────────────
alter table public.tasks
  add column project_id uuid references public.projects (id) on delete set null,
  add column pricing_type public.pricing_type,
  add column hourly_rate numeric(10, 2) check (hourly_rate >= 0),
  add column final_price numeric(10, 2) check (final_price >= 0),
  add constraint tasks_pricing_rules check (
    (pricing_type = 'hourly' or hourly_rate is null)
    and (pricing_type <> 'fixed' or final_price is not null)
    and (pricing_type is not null or final_price is null)
  ),
  -- משימה בפרויקט מתומחרת בפרויקט, לא בעצמה
  add constraint tasks_project_not_priced check (project_id is null or pricing_type is null),
  -- משימה אישית: בלי פרויקט ובלי תמחור
  add constraint tasks_personal_no_pricing check (
    category <> 'personal' or (project_id is null and pricing_type is null)
  );
create index tasks_project_idx on public.tasks (project_id);

-- הלקוח של המשימה חייב להיות הלקוח של הפרויקט
create or replace function public.check_task_project_client()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_client uuid;
begin
  if new.project_id is null then
    return new;
  end if;
  select client_id into v_client from public.projects where id = new.project_id;
  if v_client is distinct from new.client_id then
    raise exception 'המשימה והפרויקט חייבים להיות של אותו לקוח' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tasks_project_client
  before insert or update of project_id, client_id on public.tasks
  for each row execute function public.check_task_project_client();

-- פרויקט שמשנים לו לקוח: אסור אם יש בו משימות של הלקוח הקודם
create or replace function public.check_project_client_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_id is distinct from old.client_id
     and exists (select 1 from public.tasks where project_id = new.id) then
    raise exception 'אי אפשר להחליף לקוח בפרויקט שיש בו משימות' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger projects_client_change
  before update of client_id on public.projects
  for each row execute function public.check_project_client_change();

-- ה-policy של tasks: גם הפרויקט חייב להיות של אותה בעלים
drop policy tasks_owner_all on public.tasks;
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
    and (project_id is null or exists (
      select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
  );
