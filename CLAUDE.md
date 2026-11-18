# מערכת לניהול משימות – kaminer.ai

מערכת לניהול משימות: לקוחות, שיוך משימות ללקוח, יומן פגישות, הערכת זמן ושעון למדידת זמן לכל משימה, סטטוס, וקטלוג משימות (שיווק, עסקיות, לקוחות, אישיות). משתמשת יחידה (בעלת העסק) ופרילנסרים כרשומות; סנכרון דו־כיווני ל-Google Calendar; משימות אישיות פרטיות. שלב ראשון רץ מקומית.

## Stack
- Next.js 16 (App Router, Turbopack, TypeScript), React 19. **לפני כתיבת קוד Next קרא את `AGENTS.md`** — יש שינויים שוברים (למשל `proxy.ts` במקום `middleware.ts`, ‏`cacheComponents` פעיל).
- Supabase (Postgres 17, Auth, RLS) דרך `@supabase/ssr`. מקומית: Supabase CLI על Docker Desktop.
- Tailwind 4 + shadcn/ui (new-york, ‏`components.json`), פונט Heebo, ‏`dir="rtl"`.
- zod לולידציה, date-fns לתאריכים (Asia/Jerusalem, ‏dd.mm.yyyy, שבוע מיום ראשון), Vitest לבדיקות.
- בהמשך: Supabase מנוהל + Vercel.

## מבנה
- `src/app/(auth)/login` — התחברות · `src/app/auth/callback` — חזרה מ-Supabase Auth
- `src/app/(app)/` — אזור מוגן: `page.tsx` (היום שלי), ‏tasks, clients, freelancers, catalog, calendar, settings
- `src/app/api/google/{oauth,sync}` — OAuth וסנכרון Google Calendar (צד שרת בלבד)
- `src/app/api/cron` — משימות מתוזמנות (שלב ב')
- `src/features/<domain>/` — לוגיקה לפי תחום: `actions.ts`, ‏`queries.ts`, ‏`schemas.ts`, רכיבים
- `src/components/ui` — shadcn · `src/components/layout` — מעטפת, ניווט, שעון בכותרת
- `src/lib/supabase` — לקוחות server/browser/admin (admin רק בשרת) · `src/lib/google` — OAuth, Calendar, הצפנת טוקן
- `src/types/database.ts` — נוצר ב-`npm run db:types`, לא לערוך ידנית
- `supabase/migrations` — מקור האמת של ה-DB (סכמה, RLS, views) · `supabase/seed.sql` — נתוני דמה · `supabase/functions` — Edge Functions
- `tests/` — Vitest

## פקודות
- `npm run dev` — שרת פיתוח (localhost:3000) · `npm run build` · `npm run lint` · `npm test`
- `npm run db:start` / `db:stop` — Supabase מקומי (דורש Docker) · `npm run db:reset` — מיגרציות + seed · `npm run db:types` — טיפוסים
- רכיבי shadcn: `npx shadcn@latest add <name>` (ייתכן ש-ui.shadcn.com חסום ברשת — אז לכתוב ידנית)

## קישורים
- Repo: https://github.com/b8676544-code/kaminer.ai
- אפיון: `docs/PRD.md`
- צ'קליסט הפרויקט: `CHECKLIST.md` (לעדכן דרך /proj-check)
- משימות עתידיות: `todo.md`

## תשתית Claude
- תת־סוכנים: `.claude/agents/`
- סקילים: `.claude/skills/`
- פקודות: `.claude/commands/`

## Vault (Obsidian)
- לסקירה: קרא את `Vault/Home.md` ואת הסיכום האחרון ב-`Vault/Sessions/` לפני שאתה סורק קוד.
- אחרי החלטה ארכיטקטונית: כתוב פתק ב-`Vault/Decisions/` (‏`YYYY-MM-DD-נושא.md`: הקשר, החלטה, חלופות שנדחו).
- בסוף סשן משמעותי או לפני `/clear`: כתוב סיכום ב-`Vault/Sessions/YYYY-MM-DD.md` (מה נעשה, קבצים, מה פתוח).

## Project Kit (צ'קליסט הפרויקט)
- תחילת סשן: קרא את `CHECKLIST.md` ואמור בשורה אחת מה המשימה הבאה.
- לפני כל פיצ'ר חדש: הפעל את D1 (תכנון ואישור לפני קוד), גם אם לא ביקשו במפורש.
- אחרי חיבור API או אינטגרציה: הצע את D3 (סריקת סודות).
- אחרי טבלה או API route חדשים: הפעל את D7 (הרשאות ו-RLS), אם היא בצ'קליסט.
- כשהחלון מתמלא או שהסתיים פיצ'ר: הצע את D2.
- כשכל ה-MVP בוצע: הצע `/proj-finish`.
- אחרי ביצוע משימה: עדכן את CHECKLIST.md (סימון + שורה ביומן). ההנחיות המלאות: `~/.claude/project-kit/`.

## משימות עתידיות (todo.md)
- כשאני אומרת "תרשום לעצמך" או "משימה לעתיד": מוסיפים ל-`todo.md` (נפרד מ-CHECKLIST.md).
- ניסוח: כותרת קצרה, שורת הקשר ועדיפות (גבוהה/בינונית/נמוכה).
- קוראים את `todo.md` בתחילת כל סשן ולפני שעונים על "מה נשאר לעשות".
- משימה שבוצעה: `[x]` עם תאריך, ועוברת לסעיף "בוצע". לא מוחקים.
- בסוף משימה גדולה: מציעים מה מתוך `todo.md` כדאי לעשות עכשיו.

## כללים
- סודות רק ב-`.env`, לעולם לא בקוד. כל משתנה חדש נוסף לשמו ל-`.env.example`.
- לפני פיצ'ר: תכנון ואישור (Plan Mode).
- CLAUDE.md נשאר רזה (עד כ-150 שורות). פירוט נכנס לסקילים ולסוכנים.
