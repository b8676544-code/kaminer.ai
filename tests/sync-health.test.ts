import { describe, expect, it } from "vitest";

import {
  BACKOFF_THROTTLE_MS,
  NORMAL_THROTTLE_MS,
  nextHealth,
  throttleMs,
  type HealthState,
} from "@/lib/google/sync-health";

const NOW = "2026-11-24T10:00:00.000Z";
const fresh: HealthState = { consecutive_failures: 0, failure_alert_sent_at: null };

describe("בריאות הסנכרון", () => {
  it("האטה רק אחרי 3 כשלים", () => {
    expect(throttleMs(0)).toBe(NORMAL_THROTTLE_MS);
    expect(throttleMs(2)).toBe(NORMAL_THROTTLE_MS);
    expect(throttleMs(3)).toBe(BACKOFF_THROTTLE_MS);
  });

  it("התראה אחת בכשל השלישי, ולא שוב באותו רצף", () => {
    let s: HealthState = { ...fresh };
    const alerts: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      const next = nextHealth(s, false, NOW);
      alerts.push(next.sendAlert);
      s = { consecutive_failures: next.consecutive_failures, failure_alert_sent_at: next.failure_alert_sent_at };
    }
    expect(alerts).toEqual([false, false, true, false, false]);
    expect(s).toEqual({ consecutive_failures: 5, failure_alert_sent_at: NOW });
  });

  it("הצלחה מאפסת, ורצף חדש מקבל התראה חדשה", () => {
    const reset = nextHealth({ consecutive_failures: 4, failure_alert_sent_at: NOW }, true, NOW);
    expect(reset).toEqual({ consecutive_failures: 0, failure_alert_sent_at: null, sendAlert: false });
    const third = nextHealth({ consecutive_failures: 2, failure_alert_sent_at: null }, false, NOW);
    expect(third.sendAlert).toBe(true);
  });
});
