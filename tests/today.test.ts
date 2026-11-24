import { describe, expect, it } from "vitest";

import { countGroups, groupTodayTasks, sumTodayMinutes } from "@/features/today/group";

const TODAY = "2026-11-24";
const task = (
  id: string,
  status: string,
  due_date: string | null,
  priority = "normal",
  category = "clients",
  created_at = "2026-11-01T00:00:00Z",
) => ({ id, status, priority, due_date, category, created_at });

describe("חלוקת משימות להיום שלי", () => {
  const tasks = [
    task("today", "todo", TODAY),
    task("late", "todo", "2026-11-20"),
    task("today-urgent", "todo", TODAY, "urgent"),
    task("progress", "in_progress", null),
    task("progress-today", "in_progress", TODAY),
    task("waiting-late", "waiting_client", "2026-11-01"),
    task("tomorrow", "todo", "2026-11-25"),
    task("in-week", "todo", "2026-12-01"),
    task("far", "todo", "2026-12-02"),
    task("done", "done", TODAY),
  ];
  const g = groupTodayTasks(tasks, TODAY).business;

  it("להיום: באיחור קודם, ובאותו יום הדחופה קודם", () => {
    expect(g.dueToday.map((t) => t.id)).toEqual(["late", "today-urgent", "today", "progress-today"]);
  });

  it("בתהליך בלי כפילות עם להיום", () => {
    expect(g.inProgress.map((t) => t.id)).toEqual(["progress"]);
  });

  it("ממתינות ללקוח רק ברשימה שלהן, גם באיחור", () => {
    expect(g.waiting.map((t) => t.id)).toEqual(["waiting-late"]);
    expect(g.dueToday.some((t) => t.id === "waiting-late")).toBe(false);
  });

  it("השבוע הקרוב: מחר עד עוד 7 ימים, לפי יום", () => {
    expect(g.week).toEqual([
      { day: "2026-11-25", tasks: [tasks[6]] },
      { day: "2026-12-01", tasks: [tasks[7]] },
    ]);
  });

  it("משימה שהושלמה לא מוצגת", () => {
    const all = [...g.dueToday, ...g.inProgress, ...g.waiting, ...g.week.flatMap((w) => w.tasks)];
    expect(all.some((t) => t.id === "done")).toBe(false);
  });

  it("סוף חודש: השבוע עובר לחודש הבא", () => {
    const w = groupTodayTasks([task("dec", "todo", "2026-12-05")], "2026-11-30").business.week;
    expect(w.map((x) => x.day)).toEqual(["2026-12-05"]);
  });
});

describe("ללא תאריך ומשימות אישיות", () => {
  const tasks = [
    task("undated-old", "todo", null, "normal", "marketing", "2026-11-01T00:00:00Z"),
    task("undated-new", "todo", null, "normal", "business", "2026-11-20T00:00:00Z"),
    task("undated-urgent", "todo", null, "urgent", "clients", "2026-10-01T00:00:00Z"),
    task("undated-progress", "in_progress", null),
    task("undated-waiting", "waiting_client", null),
    task("undated-done", "done", null),
    task("p-today", "todo", TODAY, "normal", "personal"),
    task("p-undated", "todo", null, "normal", "personal"),
    task("p-week", "todo", "2026-11-26", "normal", "personal"),
  ];
  const { business, personal } = groupTodayTasks(tasks, TODAY);

  it("ללא תאריך: רק מה שלא בתהליך ולא ממתין, דחופה קודם ואז החדשה", () => {
    expect(business.undated.map((t) => t.id)).toEqual(["undated-urgent", "undated-new", "undated-old"]);
    expect(business.inProgress.map((t) => t.id)).toEqual(["undated-progress"]);
    expect(business.waiting.map((t) => t.id)).toEqual(["undated-waiting"]);
  });

  it("אישיות לא מופיעות ברשימות העסקיות, ומחולקות באותה שיטה", () => {
    const businessIds = [
      ...business.dueToday,
      ...business.inProgress,
      ...business.waiting,
      ...business.undated,
      ...business.week.flatMap((w) => w.tasks),
    ].map((t) => t.id);
    expect(businessIds.some((id) => id.startsWith("p-"))).toBe(false);
    expect(personal.dueToday.map((t) => t.id)).toEqual(["p-today"]);
    expect(personal.undated.map((t) => t.id)).toEqual(["p-undated"]);
    expect(personal.week.map((w) => w.day)).toEqual(["2026-11-26"]);
    expect(countGroups(personal)).toBe(3);
  });
});

describe("שעות עבודה היום", () => {
  it("סוכם רישומים שהסתיימו ואת השעון הפתוח עד עכשיו", () => {
    const now = new Date("2026-11-24T10:30:00Z").getTime();
    const r = sumTodayMinutes(
      [
        { started_at: "2026-11-24T06:00:00Z", ended_at: "2026-11-24T07:00:00Z", duration_minutes: 60, is_billable: true },
        { started_at: "2026-11-24T08:00:00Z", ended_at: "2026-11-24T08:30:00Z", duration_minutes: 30, is_billable: false },
        { started_at: "2026-11-24T10:00:00Z", ended_at: null, duration_minutes: null, is_billable: true },
      ],
      now,
    );
    expect(r).toEqual({ total: 120, billable: 90 });
  });
});
