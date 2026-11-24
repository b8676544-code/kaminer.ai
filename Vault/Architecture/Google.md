---
type: architecture
layer: infra
date: 2026-11-19
tags:
  - architecture
---

# Google

## תפקיד
פיצ׳ר 7א (נבנה ב-23.11.2026): ‏OAuth ישיר ב-REST (`oauth.ts`, ‏state ב-cookie לפי `oauth-state.ts`), הצפנת refresh token ב-AES-GCM (`crypto.ts`), לקוח Calendar v3 (`calendar.ts`), המרות טהורות (`mapping.ts`) ומנוע `syncCalendar` (`sync.ts`) עם נעילה, משיכה מצטברת ודחיפה של `meetings.needs_push`. ממשק: `src/features/google/` (כרטיס הגדרות, ‏auto-sync ב-layout, כפתור "סנכרן עכשיו").

## קשרים
- [[API]] — `api/google/*`, ‏`api/cron/google-sync`
- [[מסד נתונים]] — `meetings`, ‏`calendar_connections`
- [[Decisions/2026-11-18-אפיון-מקומי-וגוגל]]
- [[Decisions/2026-11-23-סנכרון-google]]
- [[יומן]]
- [[ארכיטקטורה]]

<!-- auto:start -->
## קבצים (מתעדכן אוטומטית)
_עודכן: 24.11.2026 · 14 קבצים. לא לערוך ידנית בין הסימונים._

| קובץ | מה יש בו |
|---|---|
| `src/features/google/actions.ts` | selectCalendar, disconnectGoogle, syncNow |
| `src/features/google/auto-sync.tsx` | GoogleAutoSync |
| `src/features/google/google-forms.tsx` | SelectCalendarForm, DisconnectButton |
| `src/features/google/google-settings-card.tsx` | GoogleSettingsCard, SyncErrorBanner |
| `src/features/google/queries.ts` | getGoogleConnection, GoogleConnection, googleConfigured, listGoogleCalendars |
| `src/features/google/sync-health-banner.tsx` | SyncHealthBanner |
| `src/features/google/sync-now-button.tsx` | SyncNowButton |
| `src/lib/google/calendar.ts` | GoogleApiError, CalendarOption, listCalendars, listEvents, NotifyOpts, insertEvent, patchEvent, deleteEvent |
| `src/lib/google/crypto.ts` | parseEncryptionKey, getEncryptionKey, encryptToken, decryptToken |
| `src/lib/google/mapping.ts` | UNTITLED, GoogleEvent, MeetingFromGoogle, SyncedMeetingFields, GoogleEventBody, googleEventToMeeting, managesAttendees, meetingToGoogleEvent, meetingIdToEventId, resolveConflict |
| `src/lib/google/oauth-state.ts` | OAUTH_STATE_COOKIE, createOAuthState, isValidOAuthState |
| `src/lib/google/oauth.ts` | GOOGLE_SCOPES, GoogleAuthRevokedError, isGoogleConfigured, googleRedirectUri, buildAuthUrl, exchangeCode, refreshAccessToken, revokeToken, emailFromIdToken |
| `src/lib/google/sync-health.ts` | NORMAL_THROTTLE_MS, BACKOFF_THROTTLE_MS, ALERT_AFTER_FAILURES, SyncTrigger, throttleMs, HealthState, nextHealth |
| `src/lib/google/sync.ts` | SyncResult, getAccessTokenForUser, syncCalendar |
<!-- auto:end -->
