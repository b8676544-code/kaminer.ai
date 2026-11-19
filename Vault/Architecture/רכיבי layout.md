---
type: architecture
layer: ui
date: 2026-11-19
tags:
  - architecture
---

# רכיבי layout

## תפקיד
המעטפת: סרגל ניווט מימין (RTL), ניווט נייד, תפריט משתמשת ומסך "בקרוב". בהמשך גם השעון בכותרת.

## קשרים
- [[רכיבי ui]]
- [[Supabase ו-Auth]] — `user-menu` (יציאה)
- [[דפים]] — `(app)/layout.tsx`
- [[ארכיטקטורה]]

<!-- auto:start -->
## קבצים (מתעדכן אוטומטית)
_עודכן: 19.11.2026 · 5 קבצים. לא לערוך ידנית בין הסימונים._

| קובץ | מה יש בו |
|---|---|
| `src/components/layout/coming-soon.tsx` | ComingSoon |
| `src/components/layout/mobile-nav.tsx` | MobileNav |
| `src/components/layout/nav-items.ts` | NavItem, NAV_ITEMS |
| `src/components/layout/sidebar-nav.tsx` | SidebarNav |
| `src/components/layout/user-menu.tsx` | UserMenu |
<!-- auto:end -->
