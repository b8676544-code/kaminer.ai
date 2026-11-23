"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { dbErrorMessage, formToObject, zodToState, type ActionState } from "@/features/shared/form";
import { computePrice } from "@/features/shared/pricing";
import { requireUser } from "@/lib/auth";
import { projectSchema } from "./schemas";

const idSchema = z.guid();

export async function saveProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const raw = formToObject(formData);
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { ...zodToState(parsed.error), values: raw };

  const id = raw.id ? idSchema.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "מזהה לא תקין" };

  // owner_id מתמלא ב-DB. ה-RLS מוודא שגם הלקוח שייך למשתמשת
  const { data, error } = id
    ? await supabase.from("projects").update(parsed.data).eq("id", id.data).select("id").single()
    : await supabase.from("projects").insert(parsed.data).select("id").single();
  if (error) return { error: dbErrorMessage(error), values: raw };

  revalidatePath(`/clients/${parsed.data.client_id}`);
  revalidatePath("/projects", "layout");
  return { ok: true, id: data.id };
}

// "קבע לפי החישוב": מעתיק את המחיר המחושב (תעריף × שעות לחיוב) למחיר הסופי.
// החישוב נעשה כאן בשרת, לא מהערך שהדפדפן מציג.
export async function lockComputedPrice(entity: "project" | "task", entityId: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const id = idSchema.safeParse(entityId);
  if (!id.success || (entity !== "project" && entity !== "task")) return { error: "נתונים לא תקינים" };

  const table = entity === "project" ? "projects" : "tasks";
  const { data: row } = await supabase
    .from(table)
    .select("pricing_type, hourly_rate, final_price")
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { error: "לא נמצא" };
  if (row.pricing_type !== "hourly" || row.hourly_rate == null) return { error: "החישוב זמין רק בתמחור לפי שעה עם תעריף" };

  let entries = supabase.from("time_entries").select("duration_minutes, tasks!inner(project_id)").eq("is_billable", true).not("ended_at", "is", null);
  entries = entity === "project" ? entries.eq("tasks.project_id", id.data) : entries.eq("task_id", id.data);
  const { data: rows, error: entriesError } = await entries;
  if (entriesError) return { error: dbErrorMessage(entriesError) };
  const minutes = rows.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0);

  const { computed } = computePrice({ ...row, final_price: null }, minutes);
  const { error } = await supabase.from(table).update({ final_price: computed }).eq("id", id.data);
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath(entity === "project" ? `/projects/${id.data}` : `/tasks/${id.data}`);
  revalidatePath("/clients", "layout");
  revalidatePath("/projects", "layout");
  return { ok: true };
}
