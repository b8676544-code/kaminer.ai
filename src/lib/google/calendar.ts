import "server-only";

import type { GoogleEvent, GoogleEventBody } from "./mapping";

// Google Calendar API v3, ישירות ב-REST. צד שרת בלבד.
const BASE = "https://www.googleapis.com/calendar/v3";

export class GoogleApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function gfetch<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new GoogleApiError(res.status, body.error?.message ?? `Google Calendar ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const cal = (calendarId: string) => `/calendars/${encodeURIComponent(calendarId)}`;

export type CalendarOption = { id: string; name: string; primary: boolean };

// יומנים שאפשר לכתוב אליהם
export async function listCalendars(accessToken: string): Promise<CalendarOption[]> {
  type Item = { id: string; summary?: string; summaryOverride?: string; primary?: boolean; accessRole: string };
  const items: Item[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ minAccessRole: "writer", maxResults: "250" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await gfetch<{ items?: Item[]; nextPageToken?: string }>(
      accessToken,
      `/users/me/calendarList?${params}`,
    );
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items
    .map((c) => ({ id: c.id, name: c.summaryOverride ?? c.summary ?? c.id, primary: Boolean(c.primary) }))
    .sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name, "he"));
}

// סנכרון מלא (timeMin) או מצטבר (syncToken). ‏410 = ה-syncToken פג, וצריך סנכרון מלא.
export async function listEvents(
  accessToken: string,
  calendarId: string,
  opts: { syncToken: string } | { timeMin: string },
): Promise<{ events: GoogleEvent[]; nextSyncToken: string | null }> {
  const events: GoogleEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;
  do {
    const params = new URLSearchParams({ singleEvents: "true", showDeleted: "true", maxResults: "2500" });
    if ("syncToken" in opts) params.set("syncToken", opts.syncToken);
    else params.set("timeMin", opts.timeMin);
    if (pageToken) params.set("pageToken", pageToken);
    const data = await gfetch<{ items?: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string }>(
      accessToken,
      `${cal(calendarId)}/events?${params}`,
    );
    events.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
    nextSyncToken = data.nextSyncToken ?? nextSyncToken;
  } while (pageToken);
  return { events, nextSyncToken };
}

// כשיש מוזמנים: Google שולח להם הזמנה, עדכון או ביטול במייל
export type NotifyOpts = { notify?: boolean };
const notifyQuery = (opts: NotifyOpts) => (opts.notify ? "?sendUpdates=all" : "");

export function insertEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: GoogleEventBody,
  opts: NotifyOpts = {},
) {
  return gfetch<GoogleEvent>(accessToken, `${cal(calendarId)}/events${notifyQuery(opts)}`, {
    method: "POST",
    body: JSON.stringify({ id: eventId, ...body }),
  });
}

export function patchEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: GoogleEventBody,
  opts: NotifyOpts = {},
) {
  return gfetch<GoogleEvent>(accessToken, `${cal(calendarId)}/events/${encodeURIComponent(eventId)}${notifyQuery(opts)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  opts: NotifyOpts = {},
): Promise<void> {
  try {
    await gfetch<void>(accessToken, `${cal(calendarId)}/events/${encodeURIComponent(eventId)}${notifyQuery(opts)}`, {
      method: "DELETE",
    });
  } catch (e) {
    // כבר נמחק ב-Google
    if (e instanceof GoogleApiError && (e.status === 404 || e.status === 410)) return;
    throw e;
  }
}
