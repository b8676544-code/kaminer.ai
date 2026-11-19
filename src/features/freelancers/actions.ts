"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { requireUser } from "@/lib/auth";
import { freelancerSchema } from "./schemas";

export async function saveFreelancer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const raw = formToObject(formData);
  const parsed = freelancerSchema.safeParse(raw);
  if (!parsed.success) return zodToState(parsed.error);

  const id = raw.id ? z.guid().safeParse(raw.id) : null;
  if (id && !id.success) return { error: "מזהה לא תקין" };

  const { data, error } = id
    ? await supabase.from("freelancers").update(parsed.data).eq("id", id.data).select("id").single()
    : await supabase.from("freelancers").insert(parsed.data).select("id").single();
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/freelancers");
  return { ok: true, id: data.id };
}

export async function setFreelancerActive(id: string, isActive: boolean): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsedId = z.guid().safeParse(id);
  if (!parsedId.success) return { error: "מזהה לא תקין" };

  const { error } = await supabase.from("freelancers").update({ is_active: isActive }).eq("id", parsedId.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/freelancers");
  return { ok: true };
}
