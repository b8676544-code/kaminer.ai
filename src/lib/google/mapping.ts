import { isoToJerusalem, jerusalemToIso } from "@/features/shared/format";

// המרה בין אירוע ב-Google Calendar לפגישה במערכת. פונקציות טהורות, בלי רשת.

export const UNTITLED = "(ללא כותרת)";
const TZ = "Asia/Jerusalem";
const MIN_EVENT_MS = 15 * 60_000;

type EventTime = { dateTime?: string; date?: string; timeZone?: string };

export type GoogleEvent = {
  id: string;
  etag?: string;
  status?: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  description?: string;
  location?: string;
  start?: EventTime;
  end?: EventTime;
  updated?: string;
};

// שדות הפגישה שמגיעים מ-Google. לקוח ומשימה לא כאן: השיוך נשאר מקומי
export type MeetingFromGoogle = {
  google_event_id: string;
  google_etag: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location: string | null;
  notes: string | null;
};

// השדות שנשלחים ל-Google
export type SyncedMeetingFields = {
  title: string;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location: string | null;
  notes: string | null;
};

export type GoogleEventBody = {
  summary: string;
  location: string | null;
  description: string | null;
  start: EventTime;
  end: EventTime;
};

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// null: האירוע בוטל, או שאין לו זמנים שאפשר להציג
export function googleEventToMeeting(ev: GoogleEvent): MeetingFromGoogle | null {
  if (ev.status === "cancelled") return null;

  let startsAt: string;
  let endsAt: string;
  let isAllDay = false;
  if (ev.start?.date && ev.end?.date) {
    // יום שלם: התאריך של הסיום בלעדי (היום שאחרי)
    isAllDay = true;
    startsAt = jerusalemToIso(ev.start.date, "00:00");
    endsAt = jerusalemToIso(ev.end.date, "00:00");
  } else if (ev.start?.dateTime && ev.end?.dateTime) {
    startsAt = new Date(ev.start.dateTime).toISOString();
    endsAt = new Date(ev.end.dateTime).toISOString();
  } else {
    return null;
  }

  // ב-DB יש אילוץ ends_at > starts_at. אירוע באורך אפס מקבל 15 דקות
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    endsAt = new Date(new Date(startsAt).getTime() + MIN_EVENT_MS).toISOString();
  }

  return {
    google_event_id: ev.id,
    google_etag: ev.etag ?? null,
    title: blankToNull(ev.summary) ?? UNTITLED,
    starts_at: startsAt,
    ends_at: endsAt,
    is_all_day: isAllDay,
    location: blankToNull(ev.location),
    notes: blankToNull(ev.description),
  };
}

export function meetingToGoogleEvent(m: SyncedMeetingFields): GoogleEventBody {
  const time = (iso: string): EventTime =>
    m.is_all_day ? { date: isoToJerusalem(iso).date } : { dateTime: iso, timeZone: TZ };
  return {
    summary: m.title,
    location: m.location,
    description: m.notes,
    start: time(m.starts_at),
    end: time(m.ends_at),
  };
}

// מזהה האירוע ב-Google נגזר מה-uuid של הפגישה. ‏hex הוא תת־קבוצה של base32hex
// שמותר ב-Google, ולכן יצירה חוזרת של אותה פגישה מחזירה 409 ולא יוצרת כפילות.
export function meetingIdToEventId(meetingId: string): string {
  return meetingId.replace(/-/g, "").toLowerCase();
}

// שינוי בשני הצדדים מאז הסנכרון האחרון: העדכון האחרון גובר (PRD §3.5)
export function resolveConflict(localUpdatedAt: string, googleUpdated: string | undefined): "local" | "google" {
  if (!googleUpdated) return "local";
  return new Date(googleUpdated).getTime() >= new Date(localUpdatedAt).getTime() ? "google" : "local";
}
