"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { parseChecklistLines, taskSchema, taskStatusSchema } from "./schemas";

const idSchema = z.guid();

function revalidateTasks(taskId?: string) {
  revalidatePath("/tasks");
  revalidatePath("/clients", "layout");
  if (taskId) revalidatePath(`/tasks/${taskId}`);
}

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

// ה-FK לא בודק בעלות, לכן מוודאים דרך RLS שהתבנית שייכת למשתמשת. אחרת: null.
async function ownTemplateId(supabase: Supabase, raw: string | undefined): Promise<string | null> {
  const id = idSchema.safeParse(raw);
  if (!id.success) return null;
  const { data } = await supabase.from("task_templates").select("id").eq("id", id.data).maybeSingle();
  return data?.id ?? null;
}

export async function saveTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const raw = formToObject(formData);
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return zodToState(parsed.error);

  const id = raw.id ? idSchema.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "מזהה לא תקין" };

  let taskId: string;
  if (id) {
    const { error } = await supabase.from("tasks").update(parsed.data).eq("id", id.data);
    if (error) return { error: dbErrorMessage(error) };
    taskId = id.data;
  } else {
    const templateId = await ownTemplateId(supabase, raw.template_id);
    // owner_id ו-created_by מתמלאים ב-DB מ-auth.uid()
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...parsed.data, template_id: templateId })
      .select("id")
      .single();
    if (error) return { error: dbErrorMessage(error) };
    taskId = data.id;

    const items = parseChecklistLines(raw.checklist);
    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("task_checklist_items")
        .insert(items.map((text, position) => ({ task_id: taskId, text, position })));
      if (itemsError) return { error: "המשימה נשמרה, אבל תתי־המשימות לא נשמרו" };
    }
  }

  revalidateTasks(taskId);
  redirect(`/tasks/${taskId}`);
}

export async function setTaskStatus(taskId: string, status: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const id = idSchema.safeParse(taskId);
  const st = taskStatusSchema.safeParse(status);
  if (!id.success || !st.success) return { error: "נתונים לא תקינים" };

  // completed_at מתעדכן בטריגר לפי הסטטוס
  const { error } = await supabase.from("tasks").update({ status: st.data }).eq("id", id.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidateTasks(id.data);
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const id = idSchema.safeParse(taskId);
  if (!id.success) return { error: "מזהה לא תקין" };

  const { error } = await supabase.from("tasks").delete().eq("id", id.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidateTasks();
  redirect("/tasks");
}

// ───────────── תתי־משימות ─────────────

export async function addChecklistItem(taskId: string, text: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const id = idSchema.safeParse(taskId);
  const value = z.string().trim().min(1).max(300).safeParse(text);
  if (!id.success || !value.success) return { error: "נתונים לא תקינים" };

  const { data: last } = await supabase
    .from("task_checklist_items")
    .select("position")
    .eq("task_id", id.data)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("task_checklist_items")
    .insert({ task_id: id.data, text: value.data, position: (last?.position ?? -1) + 1 });
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath(`/tasks/${id.data}`);
  return { ok: true };
}

export async function toggleChecklistItem(taskId: string, itemId: string, isDone: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const tid = idSchema.safeParse(taskId);
  const iid = idSchema.safeParse(itemId);
  if (!tid.success || !iid.success) return { error: "נתונים לא תקינים" };

  const { error } = await supabase
    .from("task_checklist_items")
    .update({ is_done: isDone })
    .eq("id", iid.data)
    .eq("task_id", tid.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath(`/tasks/${tid.data}`);
  return { ok: true };
}

export async function deleteChecklistItem(taskId: string, itemId: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const tid = idSchema.safeParse(taskId);
  const iid = idSchema.safeParse(itemId);
  if (!tid.success || !iid.success) return { error: "נתונים לא תקינים" };

  const { error } = await supabase.from("task_checklist_items").delete().eq("id", iid.data).eq("task_id", tid.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath(`/tasks/${tid.data}`);
  return { ok: true };
}

// ───────────── הערות ─────────────

export async function addNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const id = idSchema.safeParse(formData.get("task_id"));
  const body = z.string().trim().min(1, "הערה ריקה").max(5000, "הערה ארוכה מדי").safeParse(formData.get("body"));
  if (!id.success) return { error: "מזהה לא תקין" };
  if (!body.success) return { error: body.error.issues[0].message };

  // author_id מתמלא ב-DB מ-auth.uid()
  const { error } = await supabase.from("task_notes").insert({ task_id: id.data, body: body.data });
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath(`/tasks/${id.data}`);
  return { ok: true };
}
