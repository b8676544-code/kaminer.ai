import { describe, expect, it } from "vitest";

import { clientSchema } from "@/features/clients/schemas";
import { allDayMeetingSchema, meetingSchema } from "@/features/meetings/schemas";

const CLIENT = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("כתובת אתר ללקוח", () => {
  const parse = (website: string) => clientSchema.safeParse({ name: "ספרי קודש אור החיים", website });

  it("בלי פרוטוקול מוסיפים https://", () => {
    expect(parse("or-hachaim.co.il").data?.website).toBe("https://or-hachaim.co.il");
  });

  it("כתובת מלאה נשמרת כמו שהיא", () => {
    expect(parse("http://example.com/shop").data?.website).toBe("http://example.com/shop");
  });

  it("ריק = null", () => {
    expect(parse("").data?.website).toBeNull();
  });

  it("פרוטוקול לא של אתר נחסם", () => {
    expect(parse("javascript:alert(1)").success).toBe(false);
    expect(parse("ftp://example.com").success).toBe(false);
  });

  it("טקסט שאינו כתובת נכשל", () => {
    expect(parse("לא אתר").success).toBe(false);
  });
});

describe("פגישה אישית או עסקית", () => {
  const base = { title: "פגישה", date: "2026-12-01", start: "10:00", end: "11:00" };

  it("ברירת מחדל: עסקית", () => {
    expect(meetingSchema.safeParse(base).data?.is_personal).toBe(false);
  });

  it("אישית: הלקוח מתאפס", () => {
    const r = meetingSchema.safeParse({ ...base, title: "תור לרופא", is_personal: "true", client_id: CLIENT });
    expect(r.data).toMatchObject({ is_personal: true, client_id: null });
  });

  it("עסקית שומרת לקוח", () => {
    const r = meetingSchema.safeParse({ ...base, is_personal: "false", client_id: CLIENT });
    expect(r.data).toMatchObject({ is_personal: false, client_id: CLIENT });
  });

  it("יום שלם אישי: הלקוח מתאפס", () => {
    const r = allDayMeetingSchema.safeParse({ title: "שמחה משפחתית", is_personal: "true", client_id: CLIENT });
    expect(r.data).toMatchObject({ is_personal: true, client_id: null });
  });
});
