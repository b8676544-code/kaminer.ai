---
type: architecture
layer: infra
date: 2026-11-19
tags:
  - architecture
---

# Google

## תפקיד
פיצ׳ר 7א, עוד לא נבנה: ‏OAuth, הצפנת refresh token ‏(`GOOGLE_TOKEN_ENCRYPTION_KEY`) וסנכרון דו־כיווני מצטבר עם sync token. ההחלטה: הלוגיקה בפונקציה אחת `src/lib/google/sync.ts`, שנקראת גם מכפתור וגם מ-cron (PRD §9).

## קשרים
- [[API]] — `api/google/*`, ‏`api/cron/google-sync`
- [[מסד נתונים]] — `meetings`, ‏`calendar_connections`
- [[Decisions/2026-11-18-אפיון-מקומי-וגוגל]]
- [[ארכיטקטורה]]

<!-- auto:start -->
## קבצים (מתעדכן אוטומטית)
_עודכן: 19.11.2026 · 0 קבצים. לא לערוך ידנית בין הסימונים._

_אין עדיין קבצים באזור הזה._
<!-- auto:end -->
