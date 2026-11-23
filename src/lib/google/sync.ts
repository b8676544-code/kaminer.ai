import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "./crypto";
import { deleteEvent, GoogleApiError, insertEvent, listEvents, patchEvent } from "./calendar";
import {
  googleEventToMeeting,
  meetingIdToEventId,
  meetingToGoogleEvent,
  resolveConflict,
  type GoogleEvent,
} from "./mapping";
import { GoogleAuthRevokedError, refreshAccessToken } from "./oauth";

// מנוע הסנכרון הדו־כיווני. רץ עם service role (עוקף RLS), ולכן כל שאילתה כאן
// מסוננת ידנית לפי owner_id / user_id. נקרא מכפתור, מה-polling בדפדפן, אחרי
// שמירת פגישה, ובענן גם מ-cron.

const THROTTLE_MS = 2 * 60_000;
const LOCK_MS = 2 * 60_000;
const INITIAL_DAYS_BACK = 30;
const PUSH_BATCH = 200;

export type SyncResult =
  | { status: "ok"; changed: number; warning?: string }
  | { status: "skipped" | "not_connected" }
  | { status: "error"; error: string };

type Admin = ReturnType<typeof createAdminClient>;

export async function getAccessTokenForUser(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("calendar_connections")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return refreshAccessToken(decryptToken(data.refresh_token));
}

export async function syncCalendar(userId: string, opts: { force?: boolean } = {}): Promise<SyncResult> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("calendar_connections")
    .select("calendar_id, calendar_selected_at, refresh_token, sync_token, last_sync_attempt_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!conn || !conn.calendar_selected_at) return { status: "not_connected" };

  const now = Date.now();
  if (!opts.force && conn.last_sync_attempt_at && now - new Date(conn.last_sync_attempt_at).getTime() < THROTTLE_MS) {
    return { status: "skipped" };
  }

  // נעילה: רק סנכרון אחד בכל רגע לכל משתמשת. נעילה שפגה (קריסה) משתחררת לבד
  const nowIso = new Date(now).toISOString();
  const { data: locked } = await admin
    .from("calendar_connections")
    .update({ sync_lock_until: new Date(now + LOCK_MS).toISOString(), last_sync_attempt_at: nowIso })
    .eq("user_id", userId)
    .or(`sync_lock_until.is.null,sync_lock_until.lt.${nowIso}`)
    .select("id")
    .maybeSingle();
  if (!locked) return { status: "skipped" };

  try {
    const accessToken = await refreshAccessToken(decryptToken(conn.refresh_token));
    const ctx = { admin, userId, accessToken, calendarId: conn.calendar_id };

    const pulled = await pull(ctx, conn.sync_token);
    const pushed = await push(ctx);

    await admin
      .from("calendar_connections")
      .update({
        sync_token: pulled.nextSyncToken,
        last_synced_at: new Date().toISOString(),
        last_sync_error: pushed.errors.length ? pushed.errors.join(" · ").slice(0, 500) : null,
        sync_lock_until: null,
      })
      .eq("user_id", userId);

    return {
      status: "ok",
      changed: pulled.changed + pushed.changed,
      warning: pushed.errors.length ? pushed.errors[0] : undefined,
    };
  } catch (e) {
    const message =
      e instanceof GoogleAuthRevokedError
        ? e.message
        : e instanceof GoogleApiError
          ? `שגיאה מ-Google (${e.status}): ${e.message}`
          : "הסנכרון עם Google נכשל. ננסה שוב בסנכרון הבא.";
    console.error("[google-sync]", userId, e);
    await admin
      .from("calendar_connections")
      .update({ last_sync_error: message, sync_lock_until: null })
      .eq("user_id", userId);
    return { status: "error", error: message };
  }
}

type Ctx = { admin: Admin; userId: string; accessToken: string; calendarId: string };

// ───────────── משיכה: Google ← מערכת ─────────────
async function pull(ctx: Ctx, syncToken: string | null) {
  const timeMin = new Date(Date.now() - INITIAL_DAYS_BACK * 86_400_000).toISOString();
  let result: Awaited<ReturnType<typeof listEvents>>;
  try {
    result = await listEvents(ctx.accessToken, ctx.calendarId, syncToken ? { syncToken } : { timeMin });
  } catch (e) {
    // ה-syncToken פג: סנכרון מלא מחדש
    if (syncToken && e instanceof GoogleApiError && e.status === 410) {
      result = await listEvents(ctx.accessToken, ctx.calendarId, { timeMin });
    } else {
      throw e;
    }
  }

  let changed = 0;
  for (let i = 0; i < result.events.length; i += PUSH_BATCH) {
    changed += await applyGoogleEvents(ctx, result.events.slice(i, i + PUSH_BATCH));
  }
  return { nextSyncToken: result.nextSyncToken, changed };
}

async function applyGoogleEvents(ctx: Ctx, events: GoogleEvent[]): Promise<number> {
  const { data: locals, error } = await ctx.admin
    .from("meetings")
    .select("id, google_event_id, google_etag, needs_push, updated_at, deleted_at")
    .eq("owner_id", ctx.userId)
    .in(
      "google_event_id",
      events.map((e) => e.id),
    );
  if (error) throw error;
  const byEventId = new Map(locals.map((m) => [m.google_event_id, m]));

  let changed = 0;
  const syncedAt = new Date().toISOString();
  for (const ev of events) {
    const local = byEventId.get(ev.id);
    const mapped = googleEventToMeeting(ev);

    if (!mapped) {
      // בוטל ב-Google: מחיקה רכה אצלנו. רישומי זמן שקושרו לפגישה נשמרים
      if (local && !local.deleted_at) {
        await ctx.admin
          .from("meetings")
          .update({ deleted_at: syncedAt, needs_push: false, last_synced_at: syncedAt })
          .eq("id", local.id);
        changed++;
      }
      continue;
    }

    if (local) {
      // שינוי מקומי שעוד לא נדחף וחדש יותר מזה של Google: הדחיפה תגבר
      if (local.needs_push && resolveConflict(local.updated_at, ev.updated) === "local") continue;
      if (!local.needs_push && !local.deleted_at && local.google_etag && local.google_etag === mapped.google_etag) {
        continue;
      }
      await ctx.admin
        .from("meetings")
        .update({ ...mapped, deleted_at: null, needs_push: false, last_synced_at: syncedAt })
        .eq("id", local.id);
      changed++;
    } else {
      const { error: insertError } = await ctx.admin.from("meetings").insert({
        ...mapped,
        owner_id: ctx.userId,
        source: "google",
        needs_push: false,
        last_synced_at: syncedAt,
      });
      if (insertError) throw insertError;
      changed++;
    }
  }
  return changed;
}

// ───────────── דחיפה: מערכת ← Google ─────────────
async function push(ctx: Ctx): Promise<{ changed: number; errors: string[] }> {
  const { data: dirty, error } = await ctx.admin
    .from("meetings")
    .select("id, title, starts_at, ends_at, is_all_day, location, notes, google_event_id, deleted_at, updated_at")
    .eq("owner_id", ctx.userId)
    .eq("needs_push", true)
    .order("updated_at")
    .limit(PUSH_BATCH);
  if (error) throw error;

  let changed = 0;
  const errors: string[] = [];
  for (const m of dirty) {
    const syncedAt = new Date().toISOString();
    // מנקים את הסימון רק אם הפגישה לא השתנתה שוב בזמן הדחיפה
    const markClean = (extra: Record<string, string | null> = {}) =>
      ctx.admin
        .from("meetings")
        .update({ needs_push: false, last_synced_at: syncedAt, ...extra })
        .eq("id", m.id)
        .eq("updated_at", m.updated_at);

    try {
      if (m.deleted_at) {
        if (m.google_event_id) await deleteEvent(ctx.accessToken, ctx.calendarId, m.google_event_id);
        await markClean();
        changed++;
        continue;
      }

      const body = meetingToGoogleEvent(m);
      let saved: GoogleEvent;
      if (!m.google_event_id) {
        // שומרים קודם את המזהה, כך שגם אם נקרוס אחרי היצירה ב-Google
        // המשיכה הבאה תתאים את האירוע לפגישה ולא תיצור כפילות
        const eventId = meetingIdToEventId(m.id);
        await ctx.admin.from("meetings").update({ google_event_id: eventId }).eq("id", m.id);
        m.updated_at = (await currentUpdatedAt(ctx, m.id)) ?? m.updated_at;
        saved = await insertOrPatch(ctx, eventId, body);
      } else {
        saved = await patchOrInsert(ctx, m.google_event_id, body);
      }
      await markClean({ google_etag: saved.etag ?? null });
      changed++;
    } catch (e) {
      if (e instanceof GoogleAuthRevokedError) throw e;
      if (e instanceof GoogleApiError && (e.status === 401 || e.status === 429 || e.status >= 500)) throw e;
      // 403 (אירוע של מישהו אחר) וכדומה: מוותרים על הדחיפה, והמשיכה הבאה תחזיר את הגרסה של Google
      errors.push(`"${m.title}": ${e instanceof Error ? e.message : "שגיאה"}`);
      await markClean();
    }
  }
  return { changed, errors };
}

async function currentUpdatedAt(ctx: Ctx, id: string): Promise<string | null> {
  const { data } = await ctx.admin.from("meetings").select("updated_at").eq("id", id).maybeSingle();
  return data?.updated_at ?? null;
}

async function insertOrPatch(ctx: Ctx, eventId: string, body: ReturnType<typeof meetingToGoogleEvent>) {
  try {
    return await insertEvent(ctx.accessToken, ctx.calendarId, eventId, body);
  } catch (e) {
    // כבר נוצר בניסיון קודם
    if (e instanceof GoogleApiError && e.status === 409) {
      return patchEvent(ctx.accessToken, ctx.calendarId, eventId, body);
    }
    throw e;
  }
}

async function patchOrInsert(ctx: Ctx, eventId: string, body: ReturnType<typeof meetingToGoogleEvent>) {
  try {
    return await patchEvent(ctx.accessToken, ctx.calendarId, eventId, body);
  } catch (e) {
    // האירוע לא קיים ביומן הזה (נמחק, או חיבור מחדש ליומן אחר): יוצרים אותו
    if (e instanceof GoogleApiError && (e.status === 404 || e.status === 410)) {
      return insertEvent(ctx.accessToken, ctx.calendarId, eventId, body);
    }
    throw e;
  }
}
