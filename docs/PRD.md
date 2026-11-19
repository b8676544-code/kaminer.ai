# PRD — kaminer.ai: מערכת לניהול משימות

> גרסה 1.2 · 19.11.2026 · סטטוס: **מאושר** (18.11.2026)
> שינויים ב-1.2: נוסף סעיף 9, "ריצה בענן" (S6). ‏Docker הותקן.
> שינויים ב-1.1: משימות אישיות (לא עסקיות) מפורטות, סנכרון דו־כיווני ל-Google Calendar עבר ל-MVP, שלב ראשון רץ מקומית.

## 1. מטרה

מקום אחד לניהול העבודה היומית בעסק, וגם המשימות האישיות: לקוחות, משימות (חוזרות וייחודיות), פגישות מסונכרנות עם Google Calendar ומדידת זמן. המערכת עונה על שלוש שאלות:
1. **מה אני עושה היום?** משימות לפי תאריך יעד ועדיפות, ופגישות היום.
2. **כמה זמן זה באמת לוקח?** הערכה מול זמן בפועל, לכל משימה ולכל לקוח.
3. **מי מטפל במה?** אני או פרילנסר, ובאיזו עלות.

מדד הצלחה: כל עבודה ללקוח נרשמת עם זמן, ובסוף חודש אפשר לדעת כמה שעות הושקעו בכל לקוח, בלי חישובים ידניים.

## 2. קהל יעד ומשתמשים

| משתמש | שלב א' (MVP) | שלב ב' |
|---|---|---|
| **בעלת העסק** | המשתמשת היחידה שמתחברת. גישה מלאה לכל המערכת | ללא שינוי |
| **פרילנסר** | רשומה במערכת, לא מתחבר. אפשר לשייך לו משימה ולרשום לו עלות | התחברות בהזמנה: רואה רק משימות שהוקצו לו, מעדכן סטטוס ומפעיל שעון |

- **משימות אישיות (לא עסקיות)**, כמו סידורים ועניינים משפחתיים, הן קטגוריה בתוך אותה רשימת משימות, ואפשר לסנן אותן. אין להן לקוח ואין להן פרילנסר. אם מפעילים עליהן שעון, הזמן לא נכנס לדוחות העסק. הן פרטיות תמיד ליוצרת שלהן, וגם כשיצטרפו משתמשים, אף אחד אחר לא יראה אותן.
- עבודה בעיקר מ**מחשב**. הממשק מותאם קודם למחשב ונשאר שמיש בנייד. עברית בלבד, מימין לשמאל.

> **הנחה:** מבנה הנתונים בנוי כבר עכשיו לרב־משתמשים (`owner_id`, תפקידים, RLS), כדי שהוספת פרילנסרים כמשתמשים לא תדרוש מיגרציה כואבת.

## 3. User Flows

### 3.1 תחילת יום — "היום שלי" (מסך הבית)
1. נכנסת למערכת ומגיעה ל"היום שלי".
2. רואה: השעון אם רץ, פגישות היום, משימות שתאריך היעד שלהן היום או עבר, ומשימות "בתהליך".
3. לוחצת ▶ על משימה, השעון מתחיל ומוצג בכותרת בכל המסכים.
4. לוחצת ⏹ והזמן נשמר. אם הפעילה שעון על משימה אחרת, הקודם נעצר אוטומטית.

### 3.2 יצירת משימה
1. כפתור "משימה חדשה" נמצא בכל מסך.
2. בוחרת: **מתבנית** (מהקטלוג) או **משימה ייחודית** (ריקה).
3. מתבנית: הכותרת, הקטגוריה, הערכת הזמן ורשימת תתי־המשימות מתמלאים, ואפשר לערוך הכול.
4. בוחרת לקוח (חובה בקטגוריית "לקוחות"), תאריך יעד, עדיפות, ואם רוצה גם פרילנסר ועלות.
5. שמירה. המשימה מופיעה ברשימה ובדף הלקוח.

### 3.3 עבודה על משימה
- מסך משימה: פרטים, רשימת תתי־משימות לסימון, הערות, רישומי זמן, והערכה מול זמן בפועל (פס התקדמות שהופך לאדום בחריגה).
- שינוי סטטוס בלחיצה. במעבר ל"הושלם" השעון נעצר ונשמר זמן הסיום.
- הוספת רישום זמן ידני ("עבדתי שעה וחצי אתמול") ותיקון רישום קיים.

### 3.4 ניהול לקוח
1. רשימת לקוחות, ולכל לקוח: משימות פתוחות ושעות החודש.
2. דף לקוח: פרטי קשר, משימות (פתוחות והושלמו), פגישות, ושעות לפי חודש.
3. לקוח שהעבודה איתו הסתיימה עובר לארכיון ולא נמחק.

### 3.5 יומן פגישות וסנכרון Google Calendar
1. **חיבור חד־פעמי:** בהגדרות לוחצים "חבר את Google Calendar", מאשרים גישה בחשבון Google ובוחרים יומן לסנכרון (ברירת מחדל: היומן הראשי).
2. תצוגת שבוע (ברירת מחדל) ותצוגת חודש. מוצגים בה גם אירועים שנוצרו ב-Google.
3. פגישה חדשה: כותרת, זמן התחלה וסיום, לקוח (אופציונלי), משימה קשורה (אופציונלי), מיקום או קישור, והערות. היא נוצרת מיד גם ב-Google Calendar.
4. **סנכרון דו־כיווני:** יצירה, עריכה ומחיקה בכל צד מתעדכנות גם בצד השני. אירוע שהגיע מ-Google אפשר לשייך ללקוח ולמשימה. השיוך נשמר רק במערכת ולא נשלח ל-Google.
5. מתי מסתנכרן: בכניסה למערכת, כל כמה דקות כשהמערכת פתוחה, ובלחיצה על "סנכרן עכשיו". בהתנגשות, העדכון האחרון גובר.
6. פגישה לא נספרת אוטומטית כזמן עבודה. אפשר בלחיצה "רשום כזמן עבודה" על משימה.

### 3.6 קטלוג משימות
1. מסך "קטלוג": רשימת תבניות מסוננות לפי קטגוריה.
2. יצירה ועריכה של תבנית: כותרת, תיאור, קטגוריה, הערכת זמן ותתי־משימות.
3. "צור משימה מתבנית" ישירות מהקטלוג.
4. ממשימה קיימת: "שמור כתבנית".

## 4. מבנה דאטה

**DB:** ‏PostgreSQL מנוהל (Supabase). כל הטבלאות עם RLS פעיל. זמנים ב-`timestamptz`, ומשכים בדקות (`integer`). סכומים ב-`numeric(10,2)` בשקלים.

### 4.1 ערכים קבועים (enums)

| enum | ערכים |
|---|---|
| `user_role` | `owner`, `freelancer` |
| `task_category` | `marketing` (שיווק), `business` (עסקיות), `clients` (לקוחות), `personal` (אישיות) |
| `task_status` | `todo` (לביצוע), `in_progress` (בתהליך), `waiting_client` (ממתין ללקוח), `done` (הושלם) |
| `task_priority` | `low` (נמוכה), `normal` (רגילה), `urgent` (דחופה) |
| `client_status` | `active`, `archived` |

### 4.2 טבלאות

**`profiles`**: משתמש מחובר (1:1 עם `auth.users`)
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | |
| role | user_role | ב-MVP רק `owner` |
| created_at | timestamptz | |

**`freelancers`**: פרילנסרים
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK→profiles | בעלת העסק |
| full_name | text | חובה |
| email, phone | text | |
| specialty | text | למשל "עיצוב גרפי", "כתיבת תוכן" |
| default_hourly_cost | numeric(10,2) | אופציונלי |
| profile_id | uuid FK→profiles, null | **שלב ב'**: מתמלא כשהפרילנסר מקבל התחברות |
| is_active | boolean | ברירת מחדל true |
| notes | text | |
| created_at, updated_at | timestamptz | |

**`clients`**: לקוחות
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK→profiles | |
| name | text | חובה (שם העסק או הלקוח) |
| contact_name, phone, email | text | |
| notes | text | |
| status | client_status | ברירת מחדל `active` |
| hourly_rate | numeric(10,2), null | **לשלב ב'** (חיוב לפי שעות), נשמר כבר עכשיו |
| created_at, updated_at | timestamptz | |

**`task_templates`**: קטלוג משימות חוזרות
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK→profiles | |
| title | text | חובה |
| description | text | |
| category | task_category | |
| default_estimate_minutes | integer, null | |
| checklist | jsonb | מערך מחרוזות לתתי־משימות |
| is_active | boolean | |
| created_at, updated_at | timestamptz | |

**`tasks`**: משימות
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK→profiles | בעלת העסק (לצורך RLS) |
| created_by | uuid FK→profiles | מי יצרה (לפרטיות משימות אישיות) |
| title | text | חובה |
| description | text | |
| category | task_category | חובה |
| client_id | uuid FK→clients, null | **חובה** כש-`category = clients`, ו**אסור** כש-`category = personal` (CHECK) |
| status | task_status | ברירת מחדל `todo` |
| priority | task_priority | ברירת מחדל `normal` |
| due_date | date, null | |
| estimate_minutes | integer, null | הערכת זמן |
| assignee_freelancer_id | uuid FK→freelancers, null | null = אני מטפלת |
| freelancer_cost | numeric(10,2), null | כמה משולם לפרילנסר על המשימה |
| template_id | uuid FK→task_templates, null | מאיזו תבנית נוצרה |
| completed_at | timestamptz, null | מתמלא במעבר ל-`done` |
| recurrence_rule | text, null | **שלב ב'**: משימות חוזרות אוטומטית (RRULE) |
| created_at, updated_at | timestamptz | |

**`task_checklist_items`**: תתי־משימות
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| task_id | uuid FK→tasks, cascade | |
| text | text | |
| is_done | boolean | |
| position | integer | סדר |

**`task_notes`**: הערות למשימה
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| task_id | uuid FK→tasks, cascade | |
| author_id | uuid FK→profiles | |
| body | text | |
| created_at | timestamptz | |

**`time_entries`**: רישומי זמן
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| task_id | uuid FK→tasks, cascade | |
| user_id | uuid FK→profiles | מי עבדה |
| started_at | timestamptz | |
| ended_at | timestamptz, null | null = השעון רץ |
| duration_minutes | integer | מחושב בעצירה, או מוזן ידנית |
| is_manual | boolean | הוזן ידנית |
| is_billable | boolean | ברירת מחדל true, **לשלב ב'** (חיוב) |
| note | text | |
| meeting_id | uuid FK→meetings, null | אם נרשם מתוך פגישה |
| created_at, updated_at | timestamptz | |

אילוץ: **שעון רץ אחד לכל משתמש**, באמצעות אינדקס ייחודי חלקי `(user_id) WHERE ended_at IS NULL`.

**`meetings`**: פגישות
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK→profiles | |
| title | text | חובה |
| starts_at, ends_at | timestamptz | CHECK ‏`ends_at > starts_at` |
| client_id | uuid FK→clients, null | |
| task_id | uuid FK→tasks, null | |
| location | text | כתובת או קישור לשיחה |
| notes | text | |
| google_event_id | text, null | מזהה האירוע ב-Google (ייחודי לכל חיבור) |
| google_etag | text, null | לזיהוי שינויים |
| source | text | `app` או `google`, מאיפה האירוע נוצר |
| is_all_day | boolean | אירוע של יום שלם מ-Google |
| deleted_at | timestamptz, null | מחיקה רכה כדי שהמחיקה תסתנכרן |
| last_synced_at | timestamptz, null | |
| created_at, updated_at | timestamptz | |

**`calendar_connections`**: חיבור ל-Google Calendar
| שדה | סוג | הערות |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | ייחודי, חיבור אחד למשתמש |
| google_email | text | |
| calendar_id | text | היומן שנבחר (ברירת מחדל `primary`) |
| refresh_token | text | **מוצפן**, לא נחשף ל-client לעולם. נקרא רק בצד השרת |
| sync_token | text, null | לסנכרון מצטבר (רק מה שהשתנה) |
| last_synced_at | timestamptz, null | |
| created_at, updated_at | timestamptz | |

### 4.3 קשרים

```
profiles 1─* clients 1─* tasks *─1 task_templates
profiles 1─* freelancers 1─* tasks
tasks 1─* task_checklist_items
tasks 1─* task_notes
tasks 1─* time_entries *─1 profiles
clients 1─* meetings *─0..1 tasks
meetings 1─* time_entries
profiles 1─0..1 calendar_connections
```

### 4.4 הרשאות (RLS)

| טבלה | שלב א' | שלב ב' (פרילנסר מחובר) |
|---|---|---|
| clients, freelancers, task_templates, meetings | הכול כש-`owner_id = auth.uid()` | פרילנסר: אין גישה (שם הלקוח מגיע דרך view מצומצם) |
| tasks | הכול כש-`owner_id = auth.uid()`, **ו**משימה עם `category = personal` גלויה רק כש-`created_by = auth.uid()` | פרילנסר: SELECT/UPDATE (סטטוס בלבד) על משימות שהוקצו לו |
| task_checklist_items, task_notes | דרך הרשאת המשימה האב | כנ"ל |
| time_entries | הכול על רישומים של משימות שלי | פרילנסר: רק הרישומים שלו |
| profiles | קריאה ועדכון של עצמי | ללא שינוי |
| calendar_connections | אין גישה מה-client. רק צד השרת (service role) קורא את הטוקן. ה-client רואה רק סטטוס חיבור דרך view בלי טוקנים | ללא שינוי |

> שדות `freelancer_cost`, `hourly_rate` ו-`default_hourly_cost` לא ייחשפו לפרילנסר לעולם.

### 4.5 נתונים מחושבים (views, לא נשמרים)
- `task_time_summary`: לכל משימה, סך דקות בפועל מול הערכה, ואחוז חריגה.
- `client_monthly_hours`: לכל לקוח וחודש, סך שעות (וגם שעות לחיוב). לא כולל משימות אישיות.

## 5. פיצ'רים לפי עדיפות

### שלב א' — MVP
| # | פיצ'ר | עיקר |
|---|---|---|
| 1 | התחברות | מייל וסיסמה או קישור קסם, משתמשת אחת, בלי הרשמה פתוחה |
| 2 | לקוחות | CRUD, ארכיון, דף לקוח עם משימות, פגישות ושעות |
| 3 | פרילנסרים | CRUD פשוט, שיוך למשימה ועלות |
| 4 | משימות | CRUD, קטגוריה, סטטוס, עדיפות, תאריך יעד, הערכת זמן, תתי־משימות, הערות. תצוגות: רשימה עם סינון (לקוח, קטגוריה, סטטוס, פרילנסר) וקנבן לפי סטטוס |
| 5 | קטלוג | תבניות למשימות חוזרות, יצירת משימה מתבנית, "שמור כתבנית" |
| 6 | שעון | ▶/⏹ מכל מקום, שעון אחד רץ, הזנה ידנית, עריכה ומחיקה של רישום, הערכה מול בפועל |
| 7 | יומן | תצוגת שבוע וחודש, CRUD פגישה, שיוך ללקוח ולמשימה, "רשום כזמן עבודה" |
| 7א | Google Calendar | חיבור OAuth, בחירת יומן, סנכרון דו־כיווני מצטבר (sync token) בכניסה, כל כמה דקות ובלחיצה, ניתוק החיבור |
| 8 | היום שלי | מסך בית: שעון, פגישות היום, משימות להיום ובאיחור, משימות בתהליך |

### שלב ב' — עתידי (ה-DB כבר מוכן)
| פיצ'ר | מה מוכן ב-DB |
|---|---|
| תזכורות במייל (תאריך יעד, פגישה מתקרבת) | `due_date`, `starts_at` |
| סנכרון Google בזמן אמת (push notifications, דורש שרת ציבורי בענן) | `calendar_connections` |
| הצגת תאריכי יעד של משימות ב-Google Calendar | `tasks.due_date` |
| דוחות זמן לפי לקוח (ייצוא) | `time_entries`, `client_monthly_hours` |
| חיוב ותשלום לפי שעות | `clients.hourly_rate`, `time_entries.is_billable` |
| רווחיות (גבייה מול עלות פרילנסר) | `tasks.freelancer_cost` |
| פרילנסרים מתחברים | `freelancers.profile_id`, `user_role`, RLS |
| משימות חוזרות אוטומטית | `tasks.recurrence_rule` |

## 6. דרישות לא־פונקציונליות
- **שפה וכיוון:** עברית, RTL מלא, תאריכים בפורמט ישראלי (`dd.mm.yyyy`), שבוע מתחיל ביום ראשון, אזור זמן `Asia/Jerusalem`.
- **מכשיר:** מותאם קודם למחשב, ורספונסיבי לנייד.
- **שעון אמין:** הזמן מחושב משעת ההתחלה בשרת, כך שרענון או סגירת דפדפן לא מאבדים את המדידה.
- **אבטחה:** RLS על כל טבלה, סודות רק ב-`.env` (כולל `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET`), וטוקנים של Google מוצפנים ב-DB.
- **סביבת ריצה:** שלב ראשון רץ **מקומית** על המחשב. מעבר לענן ייעשה בהמשך (S6 ו-E3) בלי שינוי קוד.
- **ביצועים:** טעינת מסך עד כ-2 שניות, פעולות שעון מיידיות (עדכון אופטימי).

## 7. מחוץ להיקף (לא בונים)
- ניהול פרויקטים מורכב (Gantt, תלויות בין משימות, ספרינטים).
- הנפקת חשבוניות וסליקה בתוך המערכת (בשלב ב' לכל היותר חיבור לשירות חיצוני).
- צ'אט או התראות בזמן אמת.
- אפליקציית מובייל נייטיב.
- פורטל ללקוחות.
- העלאת קבצים למשימות (אפשר להדביק קישור בתיאור).
- ריבוי עסקים (multi-tenant) או שפות נוספות.

## 8. Stack מומלץ
- **Frontend + Backend:** ‏Next.js (App Router) עם TypeScript.
- **DB + Auth:** ‏Supabase (PostgreSQL, ‏RLS, ‏Auth).
- **UI:** ‏Tailwind CSS ו-shadcn/ui (תמיכת RTL).
- **שלב ראשון, מקומי:** ‏Supabase CLI על Docker Desktop (אותו מסד נתונים, אותה התחברות ואותו RLS כמו בענן), ו-Next.js בשרת פיתוח מקומי. ‏Google OAuth עובד עם כתובת חזרה ל-`localhost`.
- **בהמשך, ענן:** ‏Supabase מנוהל ופריסה ב-Vercel. המעבר הוא הרצת המיגרציות בענן, החלפת משתני הסביבה וסגירת הפערים שבסעיף 9.

דרישה מקדימה: Docker Desktop (הותקן ב-19.11.2026).

## 9. ריצה בענן

**המטרה:** שהמערכת תעבוד 24/7 גם כשהמחשב כבוי: התחברות מכל מכשיר, סנכרון Google ברקע, ובשלב ב' גם תזכורות.

### 9.1 מה כרגע תלוי במחשב המקומי

| # | תלות מקומית | מה קורה אם לא נטפל | המקבילה בענן |
|---|---|---|---|
| 1 | DB ו-Auth ב-Docker ‏(`supabase start`) | הנתונים קיימים רק במחשב, ונעלמים ב-`db reset` | פרויקט Supabase מנוהל (אזור אירופה). ‏`supabase link` ואז `supabase db push`. ה-seed **לא** רץ בענן |
| 2 | משתמשת הבדיקה נוצרת ב-`seed.sql` | אין משתמשת בענן | יצירה ידנית: Dashboard ← Auth ← Add user. ההרשמה נשארת סגורה |
| 3 | הגדרות Auth ב-`supabase/config.toml` ‏(`site_url`, כתובות חזרה, `enable_signup = false`) | הקובץ חל רק מקומית, וקישור קסם יפנה ל-localhost | להגדיר ב-Dashboard ← Auth ← URL Configuration: הדומיין, ‏`/auth/callback`, וכתובות preview של Vercel |
| 4 | מיילי Auth נתפסים ב-Mailpit ‏(54324) | בענן נשלחים דרך שרת ה-SMTP המובנה של Supabase, שמוגבל מאוד בכמות ומיועד לבדיקות | SMTP משלנו (למשל Resend) ב-Dashboard ← Auth ← SMTP. אותו ספק ישמש בשלב ב' לתזכורות |
| 5 | `next dev` על localhost:3000 | אין גישה מבחוץ | Vercel. משתני הסביבה מוגדרים ב-Vercel ולא ב-`.env`. ‏`NEXT_PUBLIC_SITE_URL` = הדומיין (משמש לקישור הקסם) |
| 6 | Google OAuth עם redirect ל-localhost | החיבור ל-Google נכשל בענן | להוסיף ב-Google Cloud Console את `https://<domain>/api/google/oauth/callback`. **חשוב:** אפליקציית OAuth במצב Testing מבטלת את ה-refresh token אחרי 7 ימים. צריך לפרסם אותה, או לבחור סוג Internal אם החשבון ב-Google Workspace |
| 7 | `GOOGLE_TOKEN_ENCRYPTION_KEY` מקומי | שימוש באותו מפתח בשתי הסביבות מגדיל את הנזק אם הוא דולף | מפתח חדש לענן, ב-Vercel בלבד. טוקנים מקומיים לא עוברים: מתחברים מחדש ל-Google בענן |
| 8 | הסנכרון עם Google רץ רק כשהמערכת פתוחה בדפדפן (§3.5) | שינויים מ-Google לא נכנסים עד שפותחים את המערכת | הפעלה מתוזמנת של `/api/cron/google-sync` כל 10–15 דקות (ראו 9.2) |
| 9 | אין טיפול בכשלים: סנכרון שנכשל פשוט לא קורה | טוקן שבוטל או `sync_token` שפג תוקפו ‏(410 Gone) גורמים לסנכרון להיעצר בלי שאף אחד יודע | ניסיון חוזר עם המתנה הולכת וגדלה. ב-410 עושים סנכרון מלא ומקבלים `sync_token` חדש. שדות `last_sync_error` ו-`last_sync_attempt_at` ב-`calendar_connections`, והתראה במסך ההגדרות |
| 10 | גיבוי: אין (Docker מקומי) | אובדן נתונים אם הדיסק נפגע | גיבוי יומי של Supabase, ובנוסף ייצוא `pg_dump` תקופתי (שייך ל-E2) |

**מה שלא דורש שינוי:** השעון כבר מחושב בשרת משעת ההתחלה (`time_entries.started_at`), ולכן לא תלוי בדפדפן פתוח. ‏RLS, המיגרציות והקוד זהים בין המקומי לענן. ‏`Vault/`, ‏hooks של Claude ו-`.env` הם כלי פיתוח ולא חלק מהריצה.

### 9.2 משימות מתוזמנות: איך מפעילים

**ההמלצה: ‏pg_cron + pg_net ב-Supabase** קוראים ל-route ב-Next.js:
- `pg_cron` שולח כל 10–15 דקות `POST` ל-`https://<domain>/api/cron/<job>` עם כותרת `Authorization: Bearer <CRON_SECRET>`.
- ה-route בודק את הסוד, מריץ את העבודה עם לקוח ה-admin, ומחזיר תשובה מהר.
- הסוד שמור ב-Supabase Vault ולא בטקסט גלוי בתוך ה-SQL.
- **למה לא Vercel Cron:** בחבילה החינמית של Vercel יש מגבלה על תדירות ה-cron (לבדוק את המגבלה העדכנית לפני ההחלטה). אם עוברים לחבילת Pro, אפשר להעביר ל-`vercel.json` בלי לשנות את ה-route.

| עבודה | תדירות | שלב |
|---|---|---|
| `google-sync`: משיכת שינויים מצטברת מ-Google | כל 10–15 דקות | MVP, אחרי מעבר לענן |
| `reminders`: תזכורות במייל לתאריך יעד ולפגישות | כל 15 דקות | ב' |
| `google-watch-renew`: חידוש ערוצי push של Google (פגים אחרי כמה ימים) | יומי | ב' |
| `recurring-tasks`: יצירת מופעים ממשימות חוזרות (RRULE) | יומי, בלילה | ב' |

**כללים לכל עבודה מתוזמנת:**
- **אידמפוטנטיות:** הרצה כפולה לא יוצרת כפילות. תזכורת מסומנת `reminder_sent_at`, ומשימה חוזרת מזוהה לפי (`parent_id`, תאריך).
- **ניסיונות חוזרים:** כשל זמני מנסים שוב בהרצה הבאה. אחרי 3 כשלים רצופים נשמרת שגיאה ומוצגת למשתמשת.
- **לוג:** כל הרצה כותבת שורה (עבודה, התחלה, סיום, תוצאה) לטבלה `job_runs`, שישמשו גם את E2.

### 9.3 Webhooks (שלב ב')
סנכרון בזמן אמת מ-Google ‏(push notifications) דורש endpoint ציבורי ב-HTTPS: ‏`/api/google/webhook`. הוא מאמת את `X-Goog-Channel-Token`, מחזיר 200 מיד ומסמן את החיבור כ"צריך סנכרון", והסנכרון עצמו רץ ב-cron הבא או מיד אחריו. אפשר רק אחרי הפריסה ב-Vercel.

### 9.4 פערים לפי סדר יישום

1. **Supabase מנוהל:** יצירת פרויקט, `supabase link`, `supabase db push`, יצירת המשתמשת ידנית, הגדרות Auth ב-Dashboard (שורות 1–3). ← E3
2. **SMTP:** חיבור Resend ל-Auth ובדיקת קישור קסם מהענן (שורה 4). ← E3, ואחריו D3
3. **Vercel:** פריסה, משתני סביבה, דומיין, ועדכון `NEXT_PUBLIC_SITE_URL` (שורה 5). ← E3
4. **Google OAuth בענן:** redirect לדומיין, פרסום האפליקציה או Internal, ומפתח הצפנה חדש (שורות 6–7). ← אחרי פיצ'ר 7א
5. **סנכרון ברקע:** route ‏`/api/cron/google-sync` עם `CRON_SECRET`, ‏pg_cron + pg_net, וטבלת `job_runs` (שורה 8, ‏9.2). ← מיגרציה חדשה + D7
6. **טיפול בכשלים:** טיפול ב-410, ניסיון חוזר, שדות שגיאה והתראה בהגדרות (שורה 9).
7. **גיבויים ולוגים** (שורה 10). ← E2
8. **שלב ב':** תזכורות, ‏webhook של Google וחידוש ערוצים, משימות חוזרות (9.2, ‏9.3).

> **לבנות כבר עכשיו כדי שהמעבר יהיה חלק:** בפיצ'ר 7א לכתוב את לוגיקת הסנכרון כפונקציה אחת בצד השרת (`src/lib/google/sync.ts`), שתיקרא גם מכפתור "סנכרן עכשיו" וגם מה-cron. כך המעבר לענן לא ידרוש לשכתב קוד, אלא רק להוסיף מתזמן.
