"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { syncCalendar } from "@/lib/google/sync";
import { allDayMeetingSchema, logWorkSchema, meetingSchema, type MeetingInput } from "./schemas";

const idSchema = z.guid();

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

// היומן, דף הלקוח והשעות בכותרת מושפעים, ולכן מרעננים את כל ה-layout
function revalidateMeetings() {
  revalidatePath("/", "layout");
}

// אחרי שמירה או מחיקה: שולחים ל-Google ברקע, בלי לעכב את התשובה לטופס.
// אם אין חיבור, syncCalendar חוזרת מיד. force עוקף את ה-throttle אבל לא את הנעילה.
function pushToGoogle(userId: string) {
  after(() => syncCalendar(userId, { force: true, trigger: "after-save" }).catch((e) => console.error("[google-sync]", e)));
}

// ה-RLS של meetings בודק רק את owner_id. מוודאים שהלקוח והמשימה גלויים למשתמשת
// (כלומר שלה), כדי שלא תיווצר פגישה שמצביעה על רשומה של מישהי אחרת.
async function checkLinks(
  supabase: Supabase,
  links: { client_id: string | null; task_id: string | null },
): Promise<Record<string, string> | null> {
  if (links.client_id) {
    const { data } = await supabase.from("clients").select("id").eq("id", links.client_id).maybeSingle();
    if (!data) return { client_id: "הלקוח לא נמצא" };
  }
  if (links.task_id) {
    const { data } = await supabase.from("tasks").select("id").eq("id", links.task_id).maybeSingle();
    if (!data) return { task_id: "המשימה לא נמצאה" };
  }
  return null;
}

export async function saveMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  // React 19 מאפס את הטופס אחרי שליחה. מחזירים את הערכים כדי שלא יימחקו בשגיאה
  const values = raw;
  const { supabase, user } = await requireUser();

  const id = raw.id ? idSchema.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "מזהה לא תקין" };

  // אירוע יום שלם קיים: הזמנים לא נערכים כאן
  let isAllDay = false;
  if (id) {
    const { data: existing } = await supabase
      .from("meetings")
      .select("is_all_day")
      .eq("id", id.data)
      .is("deleted_at", null)
      .maybeSingle();
    if (!existing) return { error: "הפגישה לא נמצאה" };
    isAllDay = existing.is_all_day;
  }

  const parsed = isAllDay ? allDayMeetingSchema.safeParse(raw) : meetingSchema.safeParse(raw);
  if (!parsed.success) return { ...zodToState(parsed.error), values };
  const data = parsed.data;

  const linkErrors = await checkLinks(supabase, data);
  if (linkErrors) return { error: "יש לתקן את השדות המסומנים", fieldErrors: linkErrors, values };

  if (id) {
    const { error } = await supabase.from("meetings").update(data).eq("id", id.data);
    if (error) return { error: dbErrorMessage(error), values };
  } else if ("starts_at" in data) {
    // owner_id מתמלא ב-DB מ-auth.uid(), ו-source הוא 'app' כברירת מחדל
    const { error } = await supabase.from("meetings").insert(data as MeetingInput);
    if (error) return { error: dbErrorMessage(error), values };
  } else {
    return { error: "שעות לא תקינות", values };
  }

  pushToGoogle(user.id);
  revalidateMeetings();
  return { ok: true };
}

// מחיקה רכה: השורה נשארת עם deleted_at, כדי שהסנכרון ל-Google (7א) ימחק גם שם
export async function deleteMeeting(meetingId: string): Promise<ActionState> {
  const id = idSchema.safeParse(meetingId);
  if (!id.success) return { error: "מזהה לא תקין" };
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("meetings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: dbErrorMessage(error) };
  if (!data) return { error: "הפגישה לא נמצאה" };

  pushToGoogle(user.id);
  revalidateMeetings();
  return { ok: true };
}

// "רשום כזמן עבודה": רישום זמן ידני על משימה, עם meeting_id
export async function logMeetingAsWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const values = raw;
  const parsed = logWorkSchema.safeParse(raw);
  if (!parsed.success) return { ...zodToState(parsed.error), values };
  if (new Date(parsed.data.ended_at).getTime() > Date.now()) {
    return { error: "יש לתקן את השדות המסומנים", fieldErrors: { end: "שעת הסיום עוד לא הגיעה" }, values };
  }
  const { supabase } = await requireUser();

  // הפגישה חייבת להיות של המשתמשת (RLS) ועוד לא נרשמה כזמן עבודה
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, time_entries(id)")
    .eq("id", parsed.data.meeting_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!meeting) return { error: "הפגישה לא נמצאה" };
  if (meeting.time_entries.length > 0) return { error: "הפגישה כבר נרשמה כזמן עבודה" };

  // user_id מתמלא ב-DB מ-auth.uid(). ה-RLS של time_entries בודק שהמשימה שלה
  const { error } = await supabase.from("time_entries").insert({ ...parsed.data, is_manual: true });
  if (error) return { error: dbErrorMessage(error), values };

  revalidateMeetings();
  return { ok: true };
}
