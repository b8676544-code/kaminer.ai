"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { clientSchema } from "./schemas";

export async function saveClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const raw = formToObject(formData);
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) return zodToState(parsed.error);

  const id = raw.id ? z.uuid().safeParse(raw.id) : null;
  if (id && !id.success) return { error: "מזהה לא תקין" };

  // owner_id מתמלא ב-DB (auth.uid()), וה-RLS מוודא בעלות
  const { data, error } = id
    ? await supabase.from("clients").update(parsed.data).eq("id", id.data).select("id").single()
    : await supabase.from("clients").insert(parsed.data).select("id").single();
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/clients", "layout");
  return { ok: true, id: data.id };
}

export async function setClientStatus(id: string, status: "active" | "archived"): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return { error: "מזהה לא תקין" };

  const { error } = await supabase.from("clients").update({ status }).eq("id", parsedId.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/clients", "layout");
  return { ok: true };
}
