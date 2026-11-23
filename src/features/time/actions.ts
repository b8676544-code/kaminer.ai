"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { stopAtSchema, timeEntrySchema } from "./schemas";

const idSchema = z.guid();

// השעון מוצג בכותרת של כל המסכים, ולכן מרעננים את כל ה-layout
function revalidateTimer() {
  revalidatePath("/", "layout");
}

function timerErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === "P0002") return "המשימה לא נמצאה";
  if (error.code === "22023") return "שעת הסיום לפני שעת ההתחלה";
  return dbErrorMessage(error);
}

export async function startTimer(taskId: string): Promise<ActionState> {
  const id = idSchema.safeParse(taskId);
  if (!id.success) return { error: "מזהה לא תקין" };
  const { supabase } = await requireUser();

  // עצירת שעון קודם, פתיחת רישום ומעבר ל"בתהליך" קורים אטומית ב-DB
  const { error } = await supabase.rpc("start_timer", { p_task_id: id.data });
  if (error) return { error: timerErrorMessage(error) };

  revalidateTimer();
  return { ok: true };
}

// stopAt: שעת סיום מתוקנת (שעון שנשכח). בלי ערך: עכשיו, לפי שעון השרת.
export async function stopTimer(stopAt?: { date: string; time: string }): Promise<ActionState> {
  let endedAt: string | undefined;
  if (stopAt) {
    const parsed = stopAtSchema.safeParse(stopAt);
    if (!parsed.success) return { error: "שעת סיום לא תקינה" };
    endedAt = parsed.data;
  }
  const { supabase } = await requireUser();

  const { data, error } = await supabase.rpc("stop_timer", endedAt ? { p_ended_at: endedAt } : {});
  if (error) return { error: timerErrorMessage(error) };

  revalidateTimer();
  // רישום של פחות מדקה נמחק ב-DB ומוחזר null
  return { ok: true, id: data?.id ?? undefined };
}

export async function saveTimeEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  // React 19 מאפס את הטופס אחרי שליחה. מחזירים את הערכים כדי שלא יימחקו בשגיאה
  const values = { date: raw.date ?? "", start: raw.start ?? "", end: raw.end ?? "", note: raw.note ?? "" };
  const parsed = timeEntrySchema.safeParse(raw);
  if (!parsed.success) return { ...zodToState(parsed.error), values };
  if (new Date(parsed.data.ended_at).getTime() > Date.now()) {
    return { error: "יש לתקן את השדות המסומנים", fieldErrors: { end: "שעת הסיום עוד לא הגיעה" }, values };
  }
  const { supabase } = await requireUser();

  if (raw.id) {
    const id = idSchema.safeParse(raw.id);
    if (!id.success) return { error: "מזהה לא תקין" };
    // עורכים רק רישום סגור. שעון רץ נעצר מהכותרת
    const { data, error } = await supabase
      .from("time_entries")
      .update(parsed.data)
      .eq("id", id.data)
      .not("ended_at", "is", null)
      .select("id")
      .maybeSingle();
    if (error) return { error: dbErrorMessage(error) };
    if (!data) return { error: "הרישום לא נמצא" };
  } else {
    const taskId = idSchema.safeParse(raw.task_id);
    if (!taskId.success) return { error: "מזהה משימה לא תקין" };
    // user_id מתמלא ב-DB מ-auth.uid()
    const { error } = await supabase
      .from("time_entries")
      .insert({ ...parsed.data, task_id: taskId.data, is_manual: true });
    if (error) return { error: dbErrorMessage(error) };
  }

  revalidateTimer();
  return { ok: true };
}

export async function deleteTimeEntry(entryId: string): Promise<ActionState> {
  const id = idSchema.safeParse(entryId);
  if (!id.success) return { error: "מזהה לא תקין" };
  const { supabase } = await requireUser();

  const { error } = await supabase.from("time_entries").delete().eq("id", id.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidateTimer();
  return { ok: true };
}
