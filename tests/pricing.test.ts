import { describe, expect, it } from "vitest";

import { contactSchema } from "@/features/clients/schemas";
import { projectSchema } from "@/features/projects/schemas";
import { computePrice, formatMoney, normalizePricing } from "@/features/shared/pricing";
import { taskSchema } from "@/features/tasks/schemas";

const CLIENT = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const PROJECT = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("חישוב מחיר", () => {
  it("לפי שעה: תעריף × שעות, כשאין מחיר סופי", () => {
    expect(computePrice({ pricing_type: "hourly", hourly_rate: 150, final_price: null }, 90)).toEqual({
      computed: 225,
      final: 225,
      isFinalSet: false,
    });
  });

  it("לפי שעה: מחיר סופי שהוזן גובר על המחושב", () => {
    expect(computePrice({ pricing_type: "hourly", hourly_rate: 150, final_price: 200 }, 90)).toEqual({
      computed: 225,
      final: 200,
      isFinalSet: true,
    });
  });

  it("לפי שעה בלי תעריף: אין מחיר מחושב", () => {
    expect(computePrice({ pricing_type: "hourly", hourly_rate: null, final_price: null }, 60).computed).toBeNull();
  });

  it("עיגול לאגורות", () => {
    expect(computePrice({ pricing_type: "hourly", hourly_rate: 100, final_price: null }, 20).computed).toBe(33.33);
  });

  it("גלובלי: המחיר שסוכם", () => {
    expect(computePrice({ pricing_type: "fixed", hourly_rate: null, final_price: 5000 }, 600)).toEqual({
      computed: null,
      final: 5000,
      isFinalSet: true,
    });
  });

  it("לא מתומחר", () => {
    expect(computePrice({ pricing_type: null, hourly_rate: null, final_price: null }, 60).final).toBeNull();
  });

  it("תצוגת סכום", () => {
    expect(formatMoney(1234.5)).toBe("₪1,234.50");
    expect(formatMoney(5000)).toBe("₪5,000");
    expect(formatMoney(null)).toBe("—");
  });

  it("נרמול: תעריף רק לפי שעה, ובלי סוג אין מחיר", () => {
    expect(normalizePricing({ pricing_type: "fixed", hourly_rate: 100, final_price: 900 })).toEqual({
      pricing_type: "fixed",
      hourly_rate: null,
      final_price: 900,
    });
    expect(normalizePricing({ pricing_type: null, hourly_rate: 100, final_price: 900 })).toEqual({
      pricing_type: null,
      hourly_rate: null,
      final_price: null,
    });
  });
});

describe("סכמת פרויקט", () => {
  const base = { name: "אתר לבית הכנסת", client_id: CLIENT, pricing_type: "fixed", final_price: "8000" };

  it("פרויקט גלובלי תקין", () => {
    const r = projectSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data?.final_price).toBe(8000);
    expect(r.data?.status).toBe("active");
  });

  it("גלובלי בלי מחיר נכשל", () => {
    const r = projectSchema.safeParse({ ...base, final_price: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["final_price"]);
  });

  it("תאריך סיום לפני התחלה נכשל", () => {
    const r = projectSchema.safeParse({ ...base, start_date: "2026-12-10", end_date: "2026-12-01" });
    expect(r.success).toBe(false);
  });

  it("לפי שעה: התעריף נשמר", () => {
    const r = projectSchema.safeParse({ ...base, pricing_type: "hourly", hourly_rate: "180", final_price: "" });
    expect(r.data).toMatchObject({ pricing_type: "hourly", hourly_rate: 180, final_price: null });
  });
});

describe("סכמת איש קשר", () => {
  it("שם חובה, ומייל נבדק", () => {
    expect(contactSchema.safeParse({ client_id: CLIENT, name: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ client_id: CLIENT, name: "יוסף כהן", email: "לא-מייל" }).success).toBe(false);
    const ok = contactSchema.safeParse({ client_id: CLIENT, name: "יוסף כהן", mobile: "050-1234567", role: "מנהל רכש" });
    expect(ok.data).toMatchObject({ name: "יוסף כהן", mobile: "050-1234567", phone: null, email: null });
  });
});

describe("משימה: פרויקט ותמחור", () => {
  const base = { title: "עיצוב דף הבית", category: "clients", client_id: CLIENT };

  it("משימה בפרויקט: התמחור מתאפס", () => {
    const r = taskSchema.safeParse({ ...base, project_id: PROJECT, pricing_type: "fixed", final_price: "500" });
    expect(r.data).toMatchObject({ project_id: PROJECT, pricing_type: null, final_price: null });
  });

  it("משימה בודדת עם מחיר גלובלי", () => {
    const r = taskSchema.safeParse({ ...base, pricing_type: "fixed", final_price: "750" });
    expect(r.data).toMatchObject({ project_id: null, pricing_type: "fixed", final_price: 750 });
  });

  it("משימה אישית לא יכולה להיות בפרויקט", () => {
    const r = taskSchema.safeParse({ title: "קניות לשבת", category: "personal", project_id: PROJECT });
    expect(r.success).toBe(false);
  });

  it("משימה אישית: התמחור מתאפס", () => {
    const r = taskSchema.safeParse({ title: "קניות לשבת", category: "personal", pricing_type: "fixed", final_price: "1" });
    expect(r.data).toMatchObject({ pricing_type: null, final_price: null });
  });

  it("פרויקט בלי לקוח נכשל", () => {
    const r = taskSchema.safeParse({ title: "x", category: "business", project_id: PROJECT });
    expect(r.success).toBe(false);
  });
});

describe("סינון משימות לפי פרויקט", () => {
  it("מזהה תקין נשמר, ולא תקין נזרק בשקט", async () => {
    const { taskFiltersSchema } = await import("@/features/tasks/schemas");
    expect(taskFiltersSchema.parse({ project: PROJECT }).project).toBe(PROJECT);
    expect(taskFiltersSchema.parse({ project: "abc" }).project).toBeUndefined();
  });
});
