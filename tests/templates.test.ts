import { describe, expect, it } from "vitest";

import { checklistFromJson, templateFiltersSchema, templateSchema } from "@/features/templates/schemas";

// קלט כמו שמגיע מ-FormData
const base = {
  title: "ניוזלטר חודשי ללקוח",
  description: "",
  category: "clients",
  default_estimate_minutes: "",
  checklist: "",
};

describe("templateSchema", () => {
  it("ממיר שדות ריקים ל-null ו-checklist ריק למערך ריק", () => {
    const r = templateSchema.parse(base);
    expect(r).toEqual({
      title: "ניוזלטר חודשי ללקוח",
      description: null,
      category: "clients",
      default_estimate_minutes: null,
      checklist: [],
    });
  });

  it("מפצל תתי־משימות לשורות ומדלג על שורות ריקות", () => {
    const r = templateSchema.parse({ ...base, checklist: "איסוף תכנים\r\n\n  כתיבה  \nאישור לקוח\n" });
    expect(r.checklist).toEqual(["איסוף תכנים", "כתיבה", "אישור לקוח"]);
  });

  it("checklist חסר לגמרי הופך למערך ריק", () => {
    const withoutChecklist: Partial<typeof base> = { ...base };
    delete withoutChecklist.checklist;
    expect(templateSchema.parse(withoutChecklist).checklist).toEqual([]);
  });

  it("ממיר הערכה למספר", () => {
    expect(templateSchema.parse({ ...base, default_estimate_minutes: "90" }).default_estimate_minutes).toBe(90);
  });

  it.each(["0", "-5", "1.5", "abc"])("דוחה הערכה לא תקינה: %s", (value) => {
    const r = templateSchema.safeParse({ ...base, default_estimate_minutes: value });
    expect(r.success).toBe(false);
  });

  it("דוחה כותרת ריקה או רווחים בלבד", () => {
    expect(templateSchema.safeParse({ ...base, title: "   " }).success).toBe(false);
  });

  it("דוחה קטגוריה לא מוכרת", () => {
    expect(templateSchema.safeParse({ ...base, category: "other" }).success).toBe(false);
  });
});

describe("checklistFromJson", () => {
  it("מחזיר רק מחרוזות מתוך מערך", () => {
    expect(checklistFromJson(["א", 2, null, "ב"])).toEqual(["א", "ב"]);
  });

  it("ערך שאינו מערך הופך למערך ריק", () => {
    expect(checklistFromJson({ a: 1 })).toEqual([]);
    expect(checklistFromJson(null)).toEqual([]);
  });
});

describe("templateFiltersSchema", () => {
  it("מתעלם מקטגוריה לא מוכרת", () => {
    expect(templateFiltersSchema.parse({ category: "xyz" })).toEqual({ category: undefined, archived: false });
  });

  it("archived=1 מציג ארכיון", () => {
    expect(templateFiltersSchema.parse({ category: "marketing", archived: "1" })).toEqual({
      category: "marketing",
      archived: true,
    });
  });
});
