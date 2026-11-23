-- נתוני דמה לפיתוח מקומי. רץ אוטומטית ב-`npm run db:reset`.
-- ⚠️ מקומי בלבד. המשתמשת והסיסמה כאן הן ערכי בדיקה, לא לשימוש בענן.
--   מייל:   owner@kaminer.local
--   סיסמה:  kaminer-local-2026
-- קישור קסם מקומי נתפס ב-Mailpit: http://127.0.0.1:54324

-- ───────────── משתמשת בעלים ─────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'owner@kaminer.local',
  extensions.crypt('kaminer-local-2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"בעלת העסק"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@kaminer.local","email_verified":true}',
  'email', now(), now(), now()
);
-- ה-profile נוצר אוטומטית בטריגר on_auth_user_created

-- ───────────── לקוחות ─────────────
insert into public.clients (id, owner_id, name, contact_name, phone, email, notes, status, hourly_rate) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'ספרי קודש "אור החיים"', 'יוסף כהן', '050-1234567', 'yosef@example.com', 'חנות ספרים בבני ברק. ניהול רשתות ודיוור חודשי', 'active', 180),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'קייטרינג "שולחן ערוך"', 'משה לוי', '052-7654321', 'moshe@example.com', null, 'active', 160),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'עמותת "יד לאחים"', 'אברהם פרידמן', '054-1112233', null, 'פרויקט אתר הסתיים', 'archived', null);

-- ───────────── פרילנסרים ─────────────
insert into public.freelancers (id, owner_id, full_name, email, phone, specialty, default_hourly_cost) values
  ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'רחל גולדברג', 'rachel@example.com', '053-4445566', 'עיצוב גרפי', 120),
  ('f0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'שרה וייס', 'sara@example.com', null, 'כתיבת תוכן', 100);

-- ───────────── תבניות ─────────────
insert into public.task_templates (id, owner_id, title, description, category, default_estimate_minutes, checklist) values
  ('70000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'ניוזלטר חודשי ללקוח', 'כתיבה, עיצוב ושליחה של דיוור חודשי', 'clients', 120,
   '["איסוף תכנים מהלקוח","כתיבת טקסטים","עיצוב","אישור לקוח","שליחה"]'),
  ('70000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'הכנת דוח חודשי לעסק', null, 'business', 60,
   '["ריכוז חשבוניות","סיכום שעות","עדכון תזרים"]');

-- ───────────── משימות ─────────────
insert into public.tasks (id, owner_id, created_by, title, description, category, client_id, status, priority, due_date, estimate_minutes, assignee_freelancer_id, freelancer_cost, template_id) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'ניוזלטר כסלו — אור החיים', 'מבצעי חנוכה וספרים חדשים', 'clients', 'c0000000-0000-0000-0000-000000000001',
   'in_progress', 'urgent', current_date + 2, 120, 'f0000000-0000-0000-0000-000000000002', 250, '70000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'עיצוב באנר לחנוכה', null, 'clients', 'c0000000-0000-0000-0000-000000000001',
   'todo', 'normal', current_date + 5, 90, 'f0000000-0000-0000-0000-000000000001', 300, null),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'תפריט שבת חדש לאתר', 'ממתינים לצילומים מהלקוח', 'clients', 'c0000000-0000-0000-0000-000000000002',
   'waiting_client', 'normal', current_date - 1, 60, null, null, null),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'הצעת מחיר לאירועי חורף', null, 'clients', 'c0000000-0000-0000-0000-000000000002',
   'done', 'normal', current_date - 7, 45, null, null, null),
  ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'פוסט שבועי לעמוד העסק', null, 'marketing', null,
   'todo', 'low', current_date + 3, 30, null, null, null),
  ('a0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'עדכון תיק עבודות באתר', null, 'marketing', null,
   'in_progress', 'normal', null, 180, null, null, null),
  ('a0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'דוח חודשי — חשון', null, 'business', null,
   'todo', 'urgent', current_date, 60, null, null, '70000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'חידוש ביטוח עסק', null, 'business', null,
   'done', 'normal', current_date - 10, 30, null, null, null),
  ('a0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'קניות לשבת', null, 'personal', null,
   'todo', 'normal', current_date + 1, null, null, null, null),
  ('a0000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'תור לרופא שיניים לילדים', null, 'personal', null,
   'todo', 'low', current_date + 6, null, null, null, null);

-- ───────────── תתי־משימות ─────────────
insert into public.task_checklist_items (task_id, text, is_done, position) values
  ('a0000000-0000-0000-0000-000000000001', 'איסוף תכנים מהלקוח', true, 0),
  ('a0000000-0000-0000-0000-000000000001', 'כתיבת טקסטים', true, 1),
  ('a0000000-0000-0000-0000-000000000001', 'עיצוב', false, 2),
  ('a0000000-0000-0000-0000-000000000001', 'אישור לקוח', false, 3),
  ('a0000000-0000-0000-0000-000000000001', 'שליחה', false, 4);

-- ───────────── הערות ─────────────
insert into public.task_notes (task_id, author_id, body) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'הלקוח ביקש להדגיש את סט הש"ס החדש');

-- ───────────── רישומי זמן ─────────────
insert into public.time_entries (task_id, user_id, started_at, ended_at, duration_minutes, is_manual) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() - interval '2 days', now() - interval '2 days' + interval '75 minutes', 75, false),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', now() - interval '8 days', now() - interval '8 days' + interval '50 minutes', 50, true),
  ('a0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', now() - interval '1 day', now() - interval '1 day' + interval '40 minutes', 40, false);

-- ───────────── פגישות ─────────────
-- זמנים יחסיים להיום, בשעון ירושלים. אירוע יום שלם מדמה אירוע שהגיע מ-Google
insert into public.meetings (owner_id, title, starts_at, ends_at, client_id, task_id, location, notes, source, is_all_day) values
  ('11111111-1111-1111-1111-111111111111', 'פגישת סטטוס חודשית',
   ((current_date - 1) + time '10:00') at time zone 'Asia/Jerusalem', ((current_date - 1) + time '11:00') at time zone 'Asia/Jerusalem',
   'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'החנות, רח׳ רבי עקיבא', null, 'app', false),
  ('11111111-1111-1111-1111-111111111111', 'שיחת היכרות עם משה',
   ((current_date + 1) + time '09:30') at time zone 'Asia/Jerusalem', ((current_date + 1) + time '10:15') at time zone 'Asia/Jerusalem',
   'c0000000-0000-0000-0000-000000000002', null, 'https://meet.google.com/abc-defg-hij', 'לברר תפריט לחגים', 'app', false),
  ('11111111-1111-1111-1111-111111111111', 'אישור עיצוב עלון',
   ((current_date + 1) + time '10:00') at time zone 'Asia/Jerusalem', ((current_date + 1) + time '11:00') at time zone 'Asia/Jerusalem',
   'c0000000-0000-0000-0000-000000000001', null, null, null, 'app', false),
  ('11111111-1111-1111-1111-111111111111', 'יום עיון לבעלות עסקים',
   (current_date + 3)::timestamp at time zone 'Asia/Jerusalem', (current_date + 4)::timestamp at time zone 'Asia/Jerusalem',
   null, null, null, null, 'google', true);
