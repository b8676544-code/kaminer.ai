-- ═════════════ סנכרון דו־כיווני עם Google Calendar (7א) ═════════════
-- מנוע הסנכרון רץ בשרת עם service role. כתיבות מה-client (authenticated)
-- מסמנות פגישה כ"צריכה דחיפה", וכתיבות של המנוע לא מסמנות, כדי שלא תיווצר לולאה.

-- ───────────── meetings: סימון שינויים מקומיים ─────────────
alter table public.meetings
  add column needs_push boolean not null default false;

create index meetings_needs_push_idx on public.meetings (owner_id) where needs_push;

-- מסמן needs_push כשנוצרה פגישה במערכת, או כשהשתנה שדה שנשלח ל-Google.
-- שיוך ללקוח או למשימה נשאר מקומי ולכן לא מסמן.
create or replace function public.meetings_mark_dirty()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.needs_push = (new.source = 'app' or new.google_event_id is not null);
  elsif new.title is distinct from old.title
     or new.starts_at is distinct from old.starts_at
     or new.ends_at is distinct from old.ends_at
     or new.location is distinct from old.location
     or new.notes is distinct from old.notes
     or new.deleted_at is distinct from old.deleted_at then
    new.needs_push = true;
  end if;
  return new;
end;
$$;

create trigger meetings_mark_dirty
  before insert or update on public.meetings
  for each row execute function public.meetings_mark_dirty();

-- ───────────── calendar_connections: מצב הסנכרון ─────────────
alter table public.calendar_connections
  add column calendar_name text,
  add column calendar_selected_at timestamptz,
  add column last_sync_attempt_at timestamptz,
  add column last_sync_error text,
  add column sync_lock_until timestamptz;

-- ───────────── סטטוס חיבור, בלי טוקנים ─────────────
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
  created_at
from public.calendar_connections
where user_id = auth.uid();

revoke all on public.calendar_connection_status from anon;
grant select on public.calendar_connection_status to authenticated;
