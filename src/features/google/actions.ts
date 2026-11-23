"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { formToObject, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { listCalendars } from "@/lib/google/calendar";
import { decryptToken } from "@/lib/google/crypto";
import { revokeToken } from "@/lib/google/oauth";
import { getAccessTokenForUser, syncCalendar } from "@/lib/google/sync";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateAll() {
  revalidatePath("/", "layout");
}

const selectSchema = z.object({ calendar_id: z.string().min(1, "יש לבחור יומן") });

// בחירת היומן אחרי החיבור, ואז סנכרון ראשון. היומן ננעל עד ניתוק.
export async function selectCalendar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = selectSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: "יש לבחור יומן" };
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("calendar_connections")
    .select("calendar_selected_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conn) return { error: "אין חיבור ל-Google" };
  if (conn.calendar_selected_at) return { error: "כבר נבחר יומן. כדי להחליף, יש לנתק ולהתחבר מחדש" };

  // היומן חייב להיות ברשימת היומנים של החשבון, עם הרשאת כתיבה
  let calendarName: string;
  try {
    const token = await getAccessTokenForUser(user.id);
    const calendars = token ? await listCalendars(token) : [];
    const chosen = calendars.find((c) => c.id === parsed.data.calendar_id);
    if (!chosen) return { error: "היומן לא נמצא בחשבון" };
    calendarName = chosen.name;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "לא הצלחנו לאמת את היומן" };
  }

  // פגישות שנוצרו במערכת לפני החיבור: רק העתידיות נשלחות ל-Google
  const nowIso = new Date().toISOString();
  const unsent = () =>
    admin.from("meetings").update({ needs_push: false }).eq("owner_id", user.id).is("google_event_id", null);
  await unsent().lt("ends_at", nowIso);
  await unsent().not("deleted_at", "is", null);
  await admin
    .from("meetings")
    .update({ needs_push: true })
    .eq("owner_id", user.id)
    .eq("source", "app")
    .is("google_event_id", null)
    .is("deleted_at", null)
    .gte("ends_at", nowIso);

  const { error } = await admin
    .from("calendar_connections")
    .update({
      calendar_id: parsed.data.calendar_id,
      calendar_name: calendarName,
      calendar_selected_at: nowIso,
      sync_token: null,
      last_sync_attempt_at: null,
    })
    .eq("user_id", user.id);
  if (error) return { error: "שמירת היומן נכשלה" };

  const result = await syncCalendar(user.id, { force: true });
  revalidateAll();
  if (result.status === "error") return { error: result.error };
  return { ok: true };
}

// ניתוק: ביטול ההרשאה ב-Google ומחיקת החיבור. הפגישות נשארות במערכת
export async function disconnectGoogle(): Promise<ActionState> {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("calendar_connections")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conn) return { ok: true };

  try {
    await revokeToken(decryptToken(conn.refresh_token));
  } catch {
    // מפתח שהוחלף או טוקן פגום: מוחקים בכל זאת
  }
  const { error } = await admin.from("calendar_connections").delete().eq("user_id", user.id);
  if (error) return { error: "הניתוק נכשל" };

  revalidateAll();
  return { ok: true };
}

// "סנכרן עכשיו": בלי throttle
export async function syncNow(): Promise<ActionState & { changed?: number }> {
  const { user } = await requireUser();
  const result = await syncCalendar(user.id, { force: true });
  revalidateAll();
  switch (result.status) {
    case "ok":
      return result.warning ? { ok: true, changed: result.changed, error: result.warning } : { ok: true, changed: result.changed };
    case "skipped":
      return { error: "סנכרון כבר רץ. אפשר לנסות שוב בעוד רגע" };
    case "not_connected":
      return { error: "אין חיבור פעיל ל-Google" };
    case "error":
      return { error: result.error };
  }
}
