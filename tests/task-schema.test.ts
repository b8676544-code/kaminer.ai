import { describe, expect, it } from "vitest";

import { categoryRuleErrors, parseChecklistLines, taskFiltersSchema, taskSchema } from "@/features/tasks/schemas";

const CLIENT_ID = "c0000000-0000-0000-0000-000000000001";
const FREELANCER_ID = "f0000000-0000-0000-0000-000000000001";

// קלט כמו שמגיע מ-FormData: הכול מחרוזות, שדה ריק = ""
const base = {
  title: "ניוזלטר חודשי",
  description: "",
  category: "business",
  client_id: "",
  status: "todo",
  priority: "normal",
  due_date: "",
  estimate_minutes: "",
  assignee_freelancer_id: "",
  freelancer_cost: "",
};

describe("taskSchema", () => {
  it("ממיר שדות ריקים ל-null ומספרים למספר", () => {
    const parsed = taskSchema.parse({ ...base, estimate_minutes: "90", due_date: "2026-12-01" });
    expect(parsed).toMatchObject({
      description: null,
      client_id: null,
      due_date: "2026-12-01",
      estimate_minutes: 90,
      assignee_freelancer_id: null,
      freelancer_cost: null,
    });
  });

  it("דורש כותרת", () => {
    const res = taskSchema.safeParse({ ...base, title: "   " });
    expect(res.success).toBe(false);
  });

  it("בקטגוריית לקוחות חובה לקוח", () => {
    const res = taskSchema.safeParse({ ...base, category: "clients" });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path[0] === "client_id")).toBe(true);
  });

  it("בקטגוריית לקוחות עם לקוח עובר", () => {
    expect(taskSchema.safeParse({ ...base, category: "clients", client_id: CLIENT_ID }).success).toBe(true);
  });

  it("משימה אישית לא יכולה להיות משויכת ללקוח או לפרילנסר", () => {
    const res = taskSchema.safeParse({
      ...base,
      category: "personal",
      client_id: CLIENT_ID,
      assignee_freelancer_id: FREELANCER_ID,
    });
    expect(res.success).toBe(false);
    const paths = res.error?.issues.map((i) => i.path[0]);
    expect(paths).toContain("client_id");
    expect(paths).toContain("assignee_freelancer_id");
  });

  it("עלות פרילנסר בלי פרילנסר נדחית", () => {
    const res = taskSchema.safeParse({ ...base, freelancer_cost: "200" });
    expect(res.success).toBe(false);
  });

  it("דוחה הערכה שלילית, קטגוריה ותאריך לא תקינים", () => {
    expect(taskSchema.safeParse({ ...base, estimate_minutes: "-5" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...base, category: "other" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...base, due_date: "31.12.2026" }).success).toBe(false);
  });
});

describe("categoryRuleErrors", () => {
  it("לא מחזיר שגיאות למשימה עסקית רגילה", () => {
    expect(
      categoryRuleErrors({ category: "marketing", client_id: null, assignee_freelancer_id: null, freelancer_cost: null }),
    ).toEqual({});
  });
});

describe("parseChecklistLines", () => {
  it("מפצל שורות, מסיר רווחים ושורות ריקות", () => {
    expect(parseChecklistLines("סקיצה\r\n\n  עיצוב סופי  \n")).toEqual(["סקיצה", "עיצוב סופי"]);
    expect(parseChecklistLines(undefined)).toEqual([]);
  });
});

describe("taskFiltersSchema", () => {
  it("מתעלם מערכים לא מוכרים במקום להיכשל", () => {
    expect(taskFiltersSchema.parse({ status: "bogus", client: "not-an-id", category: "personal", view: "board" })).toEqual({
      status: undefined,
      client: undefined,
      category: "personal",
      freelancer: undefined,
      view: "board",
    });
  });

  it("מקבל status=open", () => {
    expect(taskFiltersSchema.parse({ status: "open" }).status).toBe("open");
  });
});
