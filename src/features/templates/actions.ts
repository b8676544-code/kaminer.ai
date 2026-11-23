"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { templateSchema } from "./schemas";

export async function saveTemplate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const raw = formToObject(formData);
  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) return { ...zodToState(parsed.error), values: raw };

  const id = raw.id ? z.guid().safeParse(raw.id) : null;
  if (id && !id.success) return { error: "מזהה לא תקין" };

  // owner_id מתמלא ב-DB (auth.uid()), וה-RLS מוודא בעלות
  const { data, error } = id
    ? await supabase.from("task_templates").update(parsed.data).eq("id", id.data).select("id").single()
    : await supabase.from("task_templates").insert(parsed.data).select("id").single();
  if (error) return { error: dbErrorMessage(error), values: raw };

  revalidatePath("/catalog");
  return { ok: true, id: data.id };
}

export async function setTemplateActive(id: string, isActive: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsedId = z.guid().safeParse(id);
  if (!parsedId.success) return { error: "מזהה לא תקין" };

  const { data, error } = await supabase
    .from("task_templates")
    .update({ is_active: isActive })
    .eq("id", parsedId.data)
    .select("id");
  if (error) return { error: dbErrorMessage(error) };
  if (data.length === 0) return { error: "התבנית לא נמצאה" };

  revalidatePath("/catalog");
  return { ok: true };
}
