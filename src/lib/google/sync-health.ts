// בריאות הסנכרון: האטה אחרי כשלים רצופים והתראה אחת לכל רצף. טהור, בלי DB.

export const NORMAL_THROTTLE_MS = 2 * 60_000;
export const BACKOFF_THROTTLE_MS = 15 * 60_000;
export const ALERT_AFTER_FAILURES = 3;

export type SyncTrigger = "manual" | "background" | "after-save" | "cron";

// סנכרון אוטומטי (רקע / cron): אחרי 3 כשלים מנסים כל 15 דקות במקום כל 2.
// סנכרון ידני ואחרי שמירה עוקפים את ה-throttle (force)
export function throttleMs(consecutiveFailures: number): number {
  return consecutiveFailures >= ALERT_AFTER_FAILURES ? BACKOFF_THROTTLE_MS : NORMAL_THROTTLE_MS;
}

export type HealthState = { consecutive_failures: number; failure_alert_sent_at: string | null };

// המצב אחרי הרצה. הצלחה מאפסת. כשל מוסיף 1, והתראה נשלחת פעם אחת כשמגיעים לסף
export function nextHealth(
  prev: HealthState,
  ok: boolean,
  nowIso: string,
): HealthState & { sendAlert: boolean } {
  if (ok) return { consecutive_failures: 0, failure_alert_sent_at: null, sendAlert: false };
  const failures = prev.consecutive_failures + 1;
  const sendAlert = failures >= ALERT_AFTER_FAILURES && !prev.failure_alert_sent_at;
  return {
    consecutive_failures: failures,
    failure_alert_sent_at: sendAlert ? nowIso : prev.failure_alert_sent_at,
    sendAlert,
  };
}
