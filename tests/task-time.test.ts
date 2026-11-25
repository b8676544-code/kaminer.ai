import { describe, expect, it } from "vitest";

import { formatDue, timeOfDay } from "@/features/shared/format";
import { taskSchema } from "@/features/tasks/schemas";
import { groupTodayTasks } from "@/features/today/group";
import { taskTimeFromGoogle } from "@/lib/google/mapping";

const base = { title: "הכנת הצעת מחיר", category: "business" };

describe("שעה במשימה (סכמה)", () => {
  it("תאריך ושעה נשמרים כ-HH:MM", () => {
    const r = taskSchema.safeParse({ ...base, due_date: "2026-12-01", due_time: "09:30" });
    expect(r.success && r.data.due_time).toBe("09:30");
  });

  it("ערך מה-DB עם שניות מתקצר", () => {
    const r = taskSchema.safeParse({ ...base, due_date: "2026-12-01", due_time: "14:00:00" });
    expect(r.success && r.data.due_time).toBe("14:00");
  });

  it("שדה ריק או חסר: בלי שעה", () => {
    const empty = taskSchema.safeParse({ ...base, due_date: "2026-12-01", due_time: "" });
    const missing = taskSchema.safeParse({ ...base, due_date: "2026-12-01" });
    expect(empty.success && empty.data.due_time).toBeNull();
    expect(missing.success && missing.data.due_time).toBeNull();
  });

  it("שעה בלי תאריך נדחית", () => {
    const r = taskSchema.safeParse({ ...base, due_time: "10:00" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["due_time"]);
  });

  it("שעה לא תקינה נדחית", () => {
    expect(taskSchema.safeParse({ ...base, due_date: "2026-12-01", due_time: "25:00" }).success).toBe(false);
  });
});

describe("אירוע משימה שהשתנה ב-Google", () => {
  it("הוזז: התאריך והשעה בשעון ישראל", () => {
    // 08:00 UTC בחורף = 10:00 בישראל
    expect(taskTimeFromGoogle({ starts_at: "2026-12-01T08:00:00.000Z", is_all_day: false })).toEqual({
      due_date: "2026-12-01",
      due_time: "10:00",
      detach: false,
    });
  });

  it("חוצה חצות בשעון ישראל: התאריך המקומי", () => {
    expect(taskTimeFromGoogle({ starts_at: "2026-11-30T22:30:00.000Z", is_all_day: false })).toMatchObject({
      due_date: "2026-12-01",
      due_time: "00:30",
    });
  });

  it("בוטל: השעה יורדת והתאריך נשאר", () => {
    expect(taskTimeFromGoogle(null)).toEqual({ due_time: null, detach: false });
  });

  it("הפך ליום שלם: רק תאריך, והאירוע מתנתק", () => {
    expect(taskTimeFromGoogle({ starts_at: "2026-11-30T22:00:00.000Z", is_all_day: true })).toEqual({
      due_date: "2026-12-01",
      due_time: null,
      detach: true,
    });
  });
});

describe("תצוגה ומיון לפי שעה", () => {
  it("formatDue ו-timeOfDay", () => {
    expect(formatDue("2026-12-01", "10:00:00")).toBe("01.12.2026 10:00");
    expect(formatDue("2026-12-01", null)).toBe("01.12.2026");
    expect(timeOfDay(null)).toBe("");
  });

  it("באותו יום: משימות עם שעה לפי השעה, ואחריהן השאר", () => {
    const t = (id: string, due_time: string | null, priority = "normal") => ({
      id,
      status: "todo",
      priority,
      category: "business",
      due_date: "2026-12-01",
      due_time,
    });
    const { business } = groupTodayTasks(
      [t("noTime", null, "urgent"), t("late", "15:00:00"), t("early", "08:30:00")],
      "2026-12-01",
    );
    expect(business.dueToday.map((x) => x.id)).toEqual(["early", "late", "noTime"]);
  });
});
