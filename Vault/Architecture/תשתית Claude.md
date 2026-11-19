---
type: architecture
layer: tooling
date: 2026-11-19
tags:
  - architecture
---

# תשתית Claude

## תפקיד
תת־סוכנים, סקילים ופקודות של הפרויקט (‏`.claude/agents|skills|commands`, כרגע ריקים), וה-hook ‏`vault-sync` שמעדכן את הפתקים האלה.

## איך ה-hook עובד
- רץ אחרי Write או Edit ‏(`.claude/settings.json`), ממפה את הקובץ לפתק ומחליף רק את הבלוק שבין `auto:start` ל-`auto:end`.
- מתעלם מ-`Vault/`, ‏`node_modules` ו-`.next`. אזור חדש (למשל תחום חדש ב-`src/features`) מקבל פתק משלו אוטומטית.
- רענון ידני של הכול: `node .claude/hooks/vault-sync.mjs --all`

## קשרים
- [[בדיקות]] — `vault-sync.test.ts`
- [[ארכיטקטורה]]

<!-- auto:start -->
## קבצים (מתעדכן אוטומטית)
_עודכן: 19.11.2026 · 2 קבצים. לא לערוך ידנית בין הסימונים._

| קובץ | מה יש בו |
|---|---|
| `.claude/hooks/vault-sync-lib.mjs` | AUTO_START, AUTO_END, toRelative, noteForPath, describeFile, routeFor, buildAutoBlock, replaceAutoBlock, newNoteTemplate, filesForNote, syncNote, allNoteNames |
| `.claude/hooks/vault-sync.mjs` | — |
<!-- auto:end -->
