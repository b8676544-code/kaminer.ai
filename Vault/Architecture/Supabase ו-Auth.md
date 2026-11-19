---
type: architecture
layer: infra
date: 2026-11-19
tags:
  - architecture
---

# Supabase ו-Auth

## תפקיד
שלושה לקוחות של Supabase: ‏`server` (‏RSC ו-actions), ‏`client` (דפדפן) ו-`admin` (‏service role, רק בשרת). ‏`src/proxy.ts` (במקום middleware ב-Next 16) מרענן את הסשן ומגן על `(app)`. ‏`lib/auth.ts` מחזיר את המשתמשת הנוכחית.

## קשרים
- [[מסד נתונים]] — RLS לפי `owner_id = auth.uid()`
- [[התחברות]], [[API]]
- [[ארכיטקטורה]]

<!-- auto:start -->
## קבצים (מתעדכן אוטומטית)
_עודכן: 19.11.2026 · 6 קבצים. לא לערוך ידנית בין הסימונים._

| קובץ | מה יש בו |
|---|---|
| `src/lib/auth.ts` | CurrentUser, getCurrentUser, requireUser |
| `src/lib/supabase/admin.ts` | createAdminClient |
| `src/lib/supabase/client.ts` | createClient |
| `src/lib/supabase/proxy.ts` | updateSession |
| `src/lib/supabase/server.ts` | createClient |
| `src/proxy.ts` | proxy, config |
<!-- auto:end -->
