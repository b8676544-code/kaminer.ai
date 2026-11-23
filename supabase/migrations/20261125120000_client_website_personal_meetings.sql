-- כתובת אתר ללקוח, וחלוקת פגישות לאישיות ועסקיות

alter table public.clients
  add column website text
    constraint clients_website_http check (website is null or website ~* '^https?://');

-- ברירת מחדל: עסקית (גם לאירועים שמיובאים מ-Google). הסימון נשמר רק במערכת.
alter table public.meetings
  add column is_personal boolean not null default false;

-- פגישה אישית לא משויכת ללקוח
alter table public.meetings
  add constraint meetings_personal_no_client check (not is_personal or client_id is null);
