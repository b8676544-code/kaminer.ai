import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import { decryptToken, encryptToken, parseEncryptionKey } from "@/lib/google/crypto";
import {
  googleEventToMeeting,
  meetingIdToEventId,
  meetingToGoogleEvent,
  resolveConflict,
  UNTITLED,
} from "@/lib/google/mapping";
import { createOAuthState, isValidOAuthState } from "@/lib/google/oauth-state";

const key = randomBytes(32);

describe("הצפנת טוקן", () => {
  it("הלוך־חזור מחזיר את הטקסט המקורי", () => {
    const token = "1//0refresh-token-דוגמה";
    const enc = encryptToken(token, key);
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain(token);
    expect(decryptToken(enc, key)).toBe(token);
  });

  it("כל הצפנה שונה (iv אקראי)", () => {
    expect(encryptToken("abc", key)).not.toBe(encryptToken("abc", key));
  });

  it("שינוי בטקסט המוצפן נכשל", () => {
    const [v, iv, tag, data] = encryptToken("secret", key).split(":");
    const flipped = Buffer.from(data, "base64");
    flipped[0] ^= 1;
    expect(() => decryptToken([v, iv, tag, flipped.toString("base64")].join(":"), key)).toThrow();
  });

  it("מפתח אחר נכשל", () => {
    expect(() => decryptToken(encryptToken("secret", key), randomBytes(32))).toThrow();
  });

  it("מפתח חייב להיות 32 בתים ב-base64", () => {
    expect(parseEncryptionKey(key.toString("base64")).length).toBe(32);
    expect(() => parseEncryptionKey(randomBytes(16).toString("base64"))).toThrow();
    expect(() => parseEncryptionKey(undefined)).toThrow();
  });
});

describe("אירוע Google ← פגישה", () => {
  it("אירוע עם שעות, כולל אזור זמן", () => {
    const m = googleEventToMeeting({
      id: "abc",
      etag: '"1"',
      status: "confirmed",
      summary: "פגישה עם משפחת כהן",
      location: "בני ברק",
      description: "להביא הצעת מחיר",
      start: { dateTime: "2026-11-24T10:00:00+02:00" },
      end: { dateTime: "2026-11-24T11:30:00+02:00" },
    });
    expect(m).toEqual({
      google_event_id: "abc",
      google_etag: '"1"',
      title: "פגישה עם משפחת כהן",
      starts_at: "2026-11-24T08:00:00.000Z",
      ends_at: "2026-11-24T09:30:00.000Z",
      is_all_day: false,
      location: "בני ברק",
      notes: "להביא הצעת מחיר",
      invite_emails: [],
    });
  });

  it("מוזמנים: בלי בעלת היומן ובלי חדרים, ורק באירוע שלך", () => {
    const base = { id: "i", start: { dateTime: "2026-11-24T10:00:00Z" }, end: { dateTime: "2026-11-24T11:00:00Z" } };
    const attendees = [
      { email: "me@example.com", self: true },
      { email: "Levi@Example.com" },
      { email: "room@resource.calendar.google.com", resource: true },
    ];
    expect(googleEventToMeeting({ ...base, organizer: { self: true }, attendees })?.invite_emails).toEqual([
      "levi@example.com",
    ]);
    // אירוע שמישהו אחר ארגן: לא מנהלים את המוזמנים שלו
    expect(googleEventToMeeting({ ...base, organizer: { self: false }, attendees })?.invite_emails).toEqual([]);
  });

  it("יום שלם: מחצות לחצות בשעון ירושלים, הסיום בלעדי", () => {
    const m = googleEventToMeeting({ id: "d", start: { date: "2026-11-24" }, end: { date: "2026-11-25" } });
    expect(m?.is_all_day).toBe(true);
    expect(m?.starts_at).toBe("2026-11-23T22:00:00.000Z");
    expect(m?.ends_at).toBe("2026-11-24T22:00:00.000Z");
  });

  it("יום שלם בשעון קיץ", () => {
    const m = googleEventToMeeting({ id: "s", start: { date: "2026-07-01" }, end: { date: "2026-07-02" } });
    expect(m?.starts_at).toBe("2026-06-30T21:00:00.000Z");
  });

  it("כותרת ריקה, ושדות ריקים הופכים ל-null", () => {
    const m = googleEventToMeeting({
      id: "x",
      summary: "  ",
      location: "",
      start: { dateTime: "2026-11-24T10:00:00Z" },
      end: { dateTime: "2026-11-24T11:00:00Z" },
    });
    expect(m?.title).toBe(UNTITLED);
    expect(m?.location).toBeNull();
    expect(m?.notes).toBeNull();
  });

  it("אירוע באורך אפס מקבל 15 דקות (אילוץ ends_at > starts_at)", () => {
    const m = googleEventToMeeting({
      id: "z",
      start: { dateTime: "2026-11-24T10:00:00Z" },
      end: { dateTime: "2026-11-24T10:00:00Z" },
    });
    expect(m?.ends_at).toBe("2026-11-24T10:15:00.000Z");
  });

  it("אירוע שבוטל או בלי זמנים מחזיר null", () => {
    expect(googleEventToMeeting({ id: "c", status: "cancelled" })).toBeNull();
    expect(googleEventToMeeting({ id: "n", start: {}, end: {} })).toBeNull();
  });
});

describe("פגישה ← אירוע Google", () => {
  const meeting = {
    title: "פגישה עם משפחת לוי",
    starts_at: "2026-11-24T08:00:00.000Z",
    ends_at: "2026-11-24T09:00:00.000Z",
    is_all_day: false,
    location: null,
    notes: null,
  };

  it("מוזמנים נשלחים כ-attendees", () => {
    const ev = meetingToGoogleEvent({ ...meeting, invite_emails: ["levi@example.com"], source: "app" });
    expect(ev.attendees).toEqual([{ email: "levi@example.com" }]);
  });

  it("פגישה מהמערכת בלי מוזמנים: רשימה ריקה (מסירה מוזמן אחרון)", () => {
    expect(meetingToGoogleEvent({ ...meeting, invite_emails: [], source: "app" }).attendees).toEqual([]);
  });

  it("אירוע מ-Google בלי מוזמנים: לא נוגעים במשתתפים", () => {
    expect(meetingToGoogleEvent({ ...meeting, invite_emails: [], source: "google" })).not.toHaveProperty("attendees");
  });

  it("פגישה עם שעות נשלחת עם אזור הזמן", () => {
    expect(
      meetingToGoogleEvent({
        title: "שיחת היכרות",
        starts_at: "2026-11-24T08:00:00.000Z",
        ends_at: "2026-11-24T09:00:00.000Z",
        is_all_day: false,
        location: null,
        notes: "שיחה בזום",
        invite_emails: [],
        source: "google",
      }),
    ).toEqual({
      summary: "שיחת היכרות",
      location: null,
      description: "שיחה בזום",
      start: { dateTime: "2026-11-24T08:00:00.000Z", timeZone: "Asia/Jerusalem" },
      end: { dateTime: "2026-11-24T09:00:00.000Z", timeZone: "Asia/Jerusalem" },
    });
  });

  it("יום שלם חוזר כתאריכים", () => {
    const ev = meetingToGoogleEvent({
      title: "כנס",
      starts_at: "2026-11-23T22:00:00.000Z",
      ends_at: "2026-11-24T22:00:00.000Z",
      is_all_day: true,
      location: null,
      notes: null,
      invite_emails: [],
      source: "google",
    });
    expect(ev.start).toEqual({ date: "2026-11-24" });
    expect(ev.end).toEqual({ date: "2026-11-25" });
  });
});

describe("עזרים", () => {
  it("מזהה אירוע מ-uuid: בלי מקפים, אותיות קטנות (base32hex)", () => {
    const id = meetingIdToEventId("3F2504E0-4F89-11D3-9A0C-0305E82C3301");
    expect(id).toBe("3f2504e04f8911d39a0c0305e82c3301");
    expect(id).toMatch(/^[0-9a-v]{5,1024}$/);
  });

  it("התנגשות: העדכון האחרון גובר", () => {
    expect(resolveConflict("2026-11-24T10:00:00Z", "2026-11-24T10:05:00Z")).toBe("google");
    expect(resolveConflict("2026-11-24T10:05:00Z", "2026-11-24T10:00:00Z")).toBe("local");
    expect(resolveConflict("2026-11-24T10:00:00Z", undefined)).toBe("local");
  });

  it("state של OAuth", () => {
    const state = createOAuthState();
    expect(state.length).toBeGreaterThanOrEqual(32);
    expect(isValidOAuthState(state, state)).toBe(true);
    expect(isValidOAuthState(state, createOAuthState())).toBe(false);
    expect(isValidOAuthState(undefined, state)).toBe(false);
    expect(isValidOAuthState(state, null)).toBe(false);
    expect(isValidOAuthState("", "")).toBe(false);
  });
});
