import { describe, expect, it } from "vitest";

import { currentMonthStart, formatDate, formatMinutes, isOverdue, todayInJerusalem } from "@/features/shared/format";

describe("formatDate", () => {
  it("עמודת date בפורמט ישראלי", () => {
    expect(formatDate("2026-11-05")).toBe("05.11.2026");
  });

  it("timestamp לפי שעון ירושלים (חצות UTC כבר יום אחרי בישראל)", () => {
    expect(formatDate("2026-11-18T23:30:00Z")).toBe("19.11.2026");
  });

  it("ערך ריק", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatMinutes", () => {
  it("שעות ודקות", () => {
    expect(formatMinutes(45)).toBe("0:45");
    expect(formatMinutes(125)).toBe("2:05");
    expect(formatMinutes(null)).toBe("—");
  });
});

describe("Jerusalem dates", () => {
  it("היום והחודש לפי ירושלים, לא UTC", () => {
    const lateUtc = new Date("2026-11-30T22:30:00Z"); // 00:30 ב-1.12 בישראל
    expect(todayInJerusalem(lateUtc)).toBe("2026-12-01");
    expect(currentMonthStart(lateUtc)).toBe("2026-12-01");
  });
});

describe("isOverdue", () => {
  it("רק כשהתאריך עבר והמשימה לא הושלמה", () => {
    expect(isOverdue("2026-11-18", "todo", "2026-11-19")).toBe(true);
    expect(isOverdue("2026-11-18", "done", "2026-11-19")).toBe(false);
    expect(isOverdue("2026-11-19", "todo", "2026-11-19")).toBe(false);
    expect(isOverdue(null, "todo", "2026-11-19")).toBe(false);
  });
});
