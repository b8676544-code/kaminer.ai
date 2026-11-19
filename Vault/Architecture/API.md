---
type: architecture
layer: api
date: 2026-11-19
tags:
  - architecture
---

# API

## תפקיד
Route handlers בצד השרת: חזרה מ-Supabase Auth, ובהמשך OAuth וסנכרון של Google ומשימות מתוזמנות. אין כאן גישה מה-client לטוקנים.

## קשרים
- `src/app/auth/callback` ← [[Supabase ו-Auth]] (קישור קסם)
- `src/app/api/google/{oauth,sync}` ← [[Google]] (פיצ׳ר 7א)
- `src/app/api/cron/*` ← מופעל מ-pg_cron עם `CRON_SECRET` (PRD §9.2)
- [[ארכיטקטורה]]

<!-- auto:start -->
## קבצים (מתעדכן אוטומטית)
_עודכן: 19.11.2026 · 1 קבצים. לא לערוך ידנית בין הסימונים._

| קובץ | מה יש בו |
|---|---|
| `src/app/auth/callback/route.ts` | /auth/callback, GET |
<!-- auto:end -->
