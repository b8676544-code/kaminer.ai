import { describe, expect, it } from "vitest";

import {
  addDays,
  calendarRange,
  layoutDay,
  meetingsOnDay,
  monthGrid,
  shiftDate,
  weekDays,
  weekStart,
  type CalendarMeeting,
} from "@/features/meetings/calendar-range";
import { logWorkSchema, meetingSchema } from "@/features/meetings/schemas";

function meeting(id: string, startsAt: string, endsAt: string, isAllDay = false): CalendarMeeting {
  return { id, starts_at: startsAt, ends_at: endsAt, is_all_day: isAllDay };
}

describe("ימים ושבועות", () => {
  it("השבוע מתחיל ביום ראשון", () => {
    expect(weekStart("2026-11-23")).toBe("2026-11-22"); // שני → ראשון
    expect(weekStart("2026-11-22")).toBe("2026-11-22"); // ראשון נשאר
    expect(weekStart("2026-11-28")).toBe("2026-11-22"); // שבת
  });

  it("addDays חוצה חודש ושנה", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("שבעה ימים מראשון עד שבת", () => {
    expect(weekDays("2026-11-25")).toEqual([
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
    ]);
  });

  it("גריד חודש: שבועות שלמים שמכסים את כל החודש", () => {
    const grid = monthGrid("2026-11-15");
    expect(grid[0][0]).toBe("2026-11-01"); // 1.11.2026 הוא יום ראשון
    expect(grid.at(-1)!.at(-1)).toBe("2026-12-05");
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(monthGrid("2027-02-10")[0][0]).toBe("2027-01-31");
  });

  it("טווח שאילתה בשעון ירושלים, סוף לא כולל", () => {
    expect(calendarRange("week", "2026-11-25")).toEqual({
      from: "2026-11-21T22:00:00.000Z",
      to: "2026-11-28T22:00:00.000Z",
    });
    expect(calendarRange("month", "2026-11-15")).toEqual({
      from: "2026-10-31T22:00:00.000Z",
      to: "2026-12-05T22:00:00.000Z",
    });
  });

  it("הקודם והבא: שבוע או חודש, בלי לגלוש בסוף חודש", () => {
    expect(shiftDate("week", "2026-11-25", 1)).toBe("2026-12-02");
    expect(shiftDate("week", "2026-11-25", -1)).toBe("2026-11-18");
    expect(shiftDate("month", "2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftDate("month", "2026-01-15", -1)).toBe("2025-12-01");
  });
});

describe("פריסת פגישות ביום", () => {
  it("מיקום לפי דקות מתחילת היום בשעון ירושלים", () => {
    // 10:00–11:30 בישראל בחורף = 08:00–09:30 UTC
    const [block] = layoutDay([meeting("a", "2026-11-23T08:00:00Z", "2026-11-23T09:30:00Z")], "2026-11-23");
    expect(block).toMatchObject({ startMin: 600, endMin: 690, column: 0, columns: 1 });
  });

  it("פגישות חופפות זו לצד זו, ופגישה נפרדת ברוחב מלא", () => {
    const blocks = layoutDay(
      [
        meeting("a", "2026-11-23T08:00:00Z", "2026-11-23T09:00:00Z"),
        meeting("b", "2026-11-23T08:30:00Z", "2026-11-23T09:30:00Z"),
        meeting("c", "2026-11-23T12:00:00Z", "2026-11-23T13:00:00Z"),
      ],
      "2026-11-23",
    );
    const byId = Object.fromEntries(blocks.map((b) => [b.meeting.id, b]));
    expect(byId.a).toMatchObject({ column: 0, columns: 2 });
    expect(byId.b).toMatchObject({ column: 1, columns: 2 });
    expect(byId.c).toMatchObject({ column: 0, columns: 1 });
  });

  it("עמודה שהתפנתה מנוצלת שוב באותו אשכול", () => {
    const blocks = layoutDay(
      [
        meeting("a", "2026-11-23T08:00:00Z", "2026-11-23T10:00:00Z"),
        meeting("b", "2026-11-23T08:00:00Z", "2026-11-23T08:30:00Z"),
        meeting("c", "2026-11-23T09:00:00Z", "2026-11-23T09:30:00Z"),
      ],
      "2026-11-23",
    );
    const byId = Object.fromEntries(blocks.map((b) => [b.meeting.id, b]));
    expect(byId.c.column).toBe(1);
    expect(byId.a.columns).toBe(2);
  });

  it("פגישה שחוצה חצות נחתכת בכל אחד מהימים", () => {
    // 23:00–01:00 בישראל
    const m = meeting("a", "2026-11-23T21:00:00Z", "2026-11-23T23:00:00Z");
    expect(layoutDay([m], "2026-11-23")[0]).toMatchObject({ startMin: 1380, endMin: 1440 });
    expect(layoutDay([m], "2026-11-24")[0]).toMatchObject({ startMin: 0, endMin: 60 });
    expect(layoutDay([m], "2026-11-25")).toEqual([]);
  });

  it("אירוע של יום שלם לא נכנס לגריד השעות", () => {
    const m = meeting("a", "2026-11-22T22:00:00Z", "2026-11-23T22:00:00Z", true);
    expect(layoutDay([m], "2026-11-23")).toEqual([]);
  });
});

describe("meetingsOnDay", () => {
  it("כולל אירוע יום שלם רב־יומי, לא כולל את יום הסיום", () => {
    const allDay = meeting("a", "2026-11-22T22:00:00Z", "2026-11-24T22:00:00Z", true); // 23–24.11
    expect(meetingsOnDay([allDay], "2026-11-23")).toHaveLength(1);
    expect(meetingsOnDay([allDay], "2026-11-24")).toHaveLength(1);
    expect(meetingsOnDay([allDay], "2026-11-25")).toHaveLength(0);
  });

  it("פגישה שמסתיימת בדיוק בחצות לא מופיעה ביום שאחריו", () => {
    const m = meeting("a", "2026-11-23T20:00:00Z", "2026-11-23T22:00:00Z"); // 22:00–00:00
    expect(meetingsOnDay([m], "2026-11-24")).toHaveLength(0);
  });

  it("ממוין: יום שלם קודם, אחר כך לפי שעה", () => {
    const list = meetingsOnDay(
      [
        meeting("late", "2026-11-23T12:00:00Z", "2026-11-23T13:00:00Z"),
        meeting("early", "2026-11-23T06:00:00Z", "2026-11-23T07:00:00Z"),
        meeting("all", "2026-11-22T22:00:00Z", "2026-11-23T22:00:00Z", true),
      ],
      "2026-11-23",
    );
    expect(list.map((m) => m.id)).toEqual(["all", "early", "late"]);
  });
});

describe("meetingSchema", () => {
  const base = {
    title: "פגישת היכרות עם משפחת כהן",
    date: "2026-11-23",
    start: "10:00",
    end: "11:00",
    client_id: "",
    task_id: "",
    location: "",
    notes: "",
  };

  it("ממיר לשעון UTC ומרוקן שדות ריקים", () => {
    expect(meetingSchema.parse(base)).toEqual({
      title: "פגישת היכרות עם משפחת כהן",
      starts_at: "2026-11-23T08:00:00.000Z",
      ends_at: "2026-11-23T09:00:00.000Z",
      client_id: null,
      task_id: null,
      location: null,
      notes: null,
    });
  });

  it("כותרת חובה", () => {
    const res = meetingSchema.safeParse({ ...base, title: "   " });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(["title"]);
  });

  it("סיום לפני התחלה או שווה לה נדחה על שדה הסיום", () => {
    for (const end of ["10:00", "09:00"]) {
      const res = meetingSchema.safeParse({ ...base, end });
      expect(res.success).toBe(false);
      expect(res.error?.issues[0].path).toEqual(["end"]);
    }
  });

  it("לקוח ומשימה חייבים להיות uuid", () => {
    expect(meetingSchema.safeParse({ ...base, client_id: "abc" }).success).toBe(false);
  });
});

describe("logWorkSchema", () => {
  const ids = {
    meeting_id: "6f1c2b9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
    task_id: "7a2d3c0f-2b3c-4d5e-9f0a-1b2c3d4e5f60",
  };

  it("משימה חובה", () => {
    const res = logWorkSchema.safeParse({ ...ids, task_id: "", date: "2026-11-23", start: "10:00", end: "11:00" });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(["task_id"]);
  });

  it("מחזיר רישום זמן עם meeting_id", () => {
    expect(logWorkSchema.parse({ ...ids, date: "2026-11-23", start: "10:00", end: "11:00", note: "" })).toEqual({
      ...ids,
      started_at: "2026-11-23T08:00:00.000Z",
      ended_at: "2026-11-23T09:00:00.000Z",
      note: null,
    });
  });
});
