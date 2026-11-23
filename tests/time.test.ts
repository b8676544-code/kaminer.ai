import { describe, expect, it } from "vitest";

import { formatElapsed, isoToJerusalem, jerusalemToIso } from "@/features/shared/format";
import { stopAtSchema, timeEntrySchema } from "@/features/time/schemas";

describe("formatElapsed", () => {
  it("שניות לשעות:דקות:שניות", () => {
    expect(formatElapsed(0)).toBe("0:00:00");
    expect(formatElapsed(249)).toBe("0:04:09");
    expect(formatElapsed(45_000)).toBe("12:30:00");
  });

  it("שבר ושלילי (שעון דפדפן מקדים את השרת)", () => {
    expect(formatElapsed(59.9)).toBe("0:00:59");
    expect(formatElapsed(-3)).toBe("0:00:00");
  });
});

describe("jerusalemToIso / isoToJerusalem", () => {
  it("חורף: UTC+2", () => {
    expect(jerusalemToIso("2026-11-22", "10:00")).toBe("2026-11-22T08:00:00.000Z");
  });

  it("קיץ: UTC+3", () => {
    expect(jerusalemToIso("2026-07-01", "10:00")).toBe("2026-07-01T07:00:00.000Z");
  });

  it("אחרי חצות בישראל הוא עדיין היום הקודם ב-UTC", () => {
    expect(jerusalemToIso("2026-11-22", "01:30")).toBe("2026-11-21T23:30:00.000Z");
  });

  it("הלוך ושוב", () => {
    for (const [date, time] of [
      ["2026-11-22", "10:00"],
      ["2026-07-01", "23:45"],
      ["2026-03-27", "04:00"],
    ]) {
      expect(isoToJerusalem(jerusalemToIso(date, time))).toEqual({ date, time });
    }
  });
});

describe("timeEntrySchema", () => {
  it("ממיר לשעות UTC ומשאיר הערה ריקה כ-null", () => {
    const r = timeEntrySchema.parse({ date: "2026-11-21", start: "10:00", end: "11:30", note: "" });
    expect(r).toEqual({
      started_at: "2026-11-21T08:00:00.000Z",
      ended_at: "2026-11-21T09:30:00.000Z",
      note: null,
    });
  });

  it("סיום לפני ההתחלה או שווה לה", () => {
    for (const end of ["09:00", "10:00"]) {
      const r = timeEntrySchema.safeParse({ date: "2026-11-21", start: "10:00", end });
      expect(r.success).toBe(false);
      expect(r.error?.issues[0].path).toEqual(["end"]);
    }
  });

  it("שעה ותאריך לא תקינים", () => {
    expect(timeEntrySchema.safeParse({ date: "2026-11-21", start: "24:00", end: "25:00" }).success).toBe(false);
    expect(timeEntrySchema.safeParse({ date: "21.11.2026", start: "10:00", end: "11:00" }).success).toBe(false);
  });
});

describe("stopAtSchema", () => {
  it("תאריך ושעה לרגע ב-UTC", () => {
    expect(stopAtSchema.parse({ date: "2026-11-21", time: "18:00" })).toBe("2026-11-21T16:00:00.000Z");
  });
});
