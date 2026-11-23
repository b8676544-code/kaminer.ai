-- תמחור משימות בפרויקט (חלק מהמחיר / מחיר נפרד), עלות פרילנסר מתוך התקציב, והזמנת משתתפים לפגישה

alter table public.tasks
  add column project_share numeric(10,2) check (project_share is null or project_share >= 0),
  add column billed_separately boolean not null default false,
  add column freelancer_cost_in_project boolean not null default true;

-- הכלל הקודם (משימה בפרויקט לא מתומחרת) מוחלף בשלושה מצבים:
-- בלי פרויקט: אין חלק ואין "נפרד" · בפרויקט וכלולה: בלי תמחור משלה · בפרויקט ונפרדת: תמחור משלה, בלי חלק
alter table public.tasks drop constraint tasks_project_not_priced;
alter table public.tasks
  add constraint tasks_project_billing check (
    case
      when project_id is null then project_share is null and not billed_separately
      when billed_separately then project_share is null
      else pricing_type is null
    end
  );

alter table public.meetings
  add column invite_emails text[] not null default '{}';

-- שינוי ברשימת המוזמנים נשלח ל-Google (וממנו מייל עדכון)
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
     or new.invite_emails is distinct from old.invite_emails
     or new.deleted_at is distinct from old.deleted_at then
    new.needs_push = true;
  end if;
  return new;
end;
$$;
