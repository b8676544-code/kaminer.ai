-- ═════════════ שעון: חישוב משך, הפעלה ועצירה אטומיות ═════════════
-- כל הזמנים נלקחים מהשרת (now()). הפונקציות הן security invoker, כך שה-RLS
-- של time_entries ו-tasks חל עליהן כרגיל.

-- ───────────── משך מחושב ─────────────
-- duration_minutes נגזר תמיד מ-ended_at − started_at (עיגול לדקה הקרובה),
-- גם ברישום ידני וגם בעריכה. בשעון רץ הוא null.
create or replace function public.set_time_entry_duration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ended_at is null then
    new.duration_minutes = null;
  else
    new.duration_minutes = round(extract(epoch from (new.ended_at - new.started_at)) / 60)::integer;
  end if;
  return new;
end;
$$;

create trigger time_entries_duration
  before insert or update of started_at, ended_at, duration_minutes on public.time_entries
  for each row execute function public.set_time_entry_duration();

-- ───────────── עצירה ─────────────
-- סוגרת את השעון הרץ של המשתמשת המחוברת. p_ended_at מאפשר לתקן שעת סיום
-- (שעון שנשכח), ולא יכול להיות בעתיד או לפני ההתחלה.
-- רישום של פחות מדקה נמחק. מחזירה את הרישום שנשמר, או null.
create or replace function public.stop_timer(p_ended_at timestamptz default null)
returns public.time_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_running public.time_entries;
  v_end timestamptz;
  v_result public.time_entries;
begin
  select * into v_running
  from public.time_entries
  where user_id = (select auth.uid()) and ended_at is null
  for update;

  if not found then
    return null;
  end if;

  v_end = least(coalesce(p_ended_at, now()), now());
  if v_end < v_running.started_at then
    raise exception 'שעת הסיום לפני שעת ההתחלה' using errcode = '22023';
  end if;

  if v_end - v_running.started_at < interval '1 minute' then
    delete from public.time_entries where id = v_running.id;
    return null;
  end if;

  update public.time_entries
  set ended_at = v_end
  where id = v_running.id
  returning * into v_result;

  return v_result;
end;
$$;

-- ───────────── הפעלה ─────────────
-- עוצרת שעון קודם (אם רץ), פותחת רישום חדש, ומעבירה משימה מ"לביצוע" ל"בתהליך".
create or replace function public.start_timer(p_task_id uuid)
returns public.time_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_result public.time_entries;
begin
  -- ה-RLS של tasks מסנן משימות שאינן שלי
  perform 1 from public.tasks where id = p_task_id;
  if not found then
    raise exception 'המשימה לא נמצאה' using errcode = 'P0002';
  end if;

  perform public.stop_timer();

  insert into public.time_entries (task_id, started_at)
  values (p_task_id, now())
  returning * into v_result;

  update public.tasks
  set status = 'in_progress'
  where id = p_task_id and status = 'todo';

  return v_result;
end;
$$;

revoke all on function public.stop_timer(timestamptz) from public, anon;
revoke all on function public.start_timer(uuid) from public, anon;
grant execute on function public.stop_timer(timestamptz) to authenticated;
grant execute on function public.start_timer(uuid) to authenticated;

-- ───────────── "הושלם" עוצר את השעון של המשימה ─────────────
create or replace function public.stop_timer_on_task_done()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    delete from public.time_entries
    where task_id = new.id and ended_at is null
      and now() - started_at < interval '1 minute';

    update public.time_entries
    set ended_at = now()
    where task_id = new.id and ended_at is null;
  end if;
  return new;
end;
$$;

create trigger tasks_stop_timer_on_done
  after update of status on public.tasks
  for each row execute function public.stop_timer_on_task_done();
