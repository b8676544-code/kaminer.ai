-- שעה למשימה: משימה עם תאריך ושעה מקבלת אירוע ביומן (from_task), שנשלח ל-Google בסנכרון הרגיל.

alter table public.tasks
  add column due_time time;

-- שעה רק כשיש תאריך
alter table public.tasks
  add constraint tasks_time_needs_date check (due_time is null or due_date is not null);

-- אירוע שנוצר ממשימה, לעומת פגישה רגילה שקושרה למשימה. לכל משימה לכל היותר אירוע פעיל אחד
alter table public.meetings
  add column from_task boolean not null default false;

create unique index meetings_task_slot_uidx on public.meetings (task_id)
  where from_task and deleted_at is null;

-- יוצר, מעדכן או מוחק (מחיקה רכה) את האירוע של המשימה.
-- רץ בהרשאות המשתמשת (RLS של meetings חל), ולכן meetings_mark_dirty מסמן אותו לדחיפה ל-Google.
-- כתיבות של מנוע הסנכרון (service_role) מעדכנות את שני הצדדים בעצמן, ולכן מדלגים עליהן.
-- משך: הערכת הזמן, או 30 דקות. לכל היותר 12 שעות.
create or replace function public.tasks_sync_slot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  slot_id uuid;
  starts timestamptz;
begin
  if current_user = 'service_role' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    update public.meetings
       set deleted_at = now()
     where task_id = old.id and from_task and deleted_at is null;
    return old;
  end if;

  select id into slot_id
    from public.meetings
   where task_id = new.id and from_task and deleted_at is null;

  if new.due_date is null or new.due_time is null then
    if slot_id is not null then
      update public.meetings set deleted_at = now() where id = slot_id;
    end if;
    return new;
  end if;

  starts := (new.due_date + new.due_time) at time zone 'Asia/Jerusalem';

  if slot_id is null then
    insert into public.meetings (owner_id, title, starts_at, ends_at, client_id, task_id, is_personal, from_task)
    values (
      new.owner_id,
      new.title,
      starts,
      starts + make_interval(mins => least(coalesce(new.estimate_minutes, 30), 720)),
      case when new.category = 'personal' then null else new.client_id end,
      new.id,
      new.category = 'personal',
      true
    );
  else
    update public.meetings
       set title = new.title,
           starts_at = starts,
           ends_at = starts + make_interval(mins => least(coalesce(new.estimate_minutes, 30), 720)),
           is_all_day = false,
           client_id = case when new.category = 'personal' then null else new.client_id end,
           is_personal = new.category = 'personal'
     where id = slot_id;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_slot_ins
  after insert on public.tasks
  for each row execute function public.tasks_sync_slot();

create trigger tasks_sync_slot_upd
  after update of title, due_date, due_time, estimate_minutes, client_id, category on public.tasks
  for each row execute function public.tasks_sync_slot();

-- לפני המחיקה, כי ה-FK מאפס את task_id באירוע
create trigger tasks_sync_slot_del
  before delete on public.tasks
  for each row execute function public.tasks_sync_slot();

revoke all on function public.tasks_sync_slot() from public, anon;
