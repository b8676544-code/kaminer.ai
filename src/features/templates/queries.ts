import "server-only";

import type { TaskCategory } from "@/features/shared/labels";
import { createClient } from "@/lib/supabase/server";
import { checklistFromJson } from "./schemas";

const TEMPLATE_FIELDS = "id, title, description, category, default_estimate_minutes, checklist, is_active";

export type Template = {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  default_estimate_minutes: number | null;
  checklist: string[];
  is_active: boolean;
};

function toTemplate(row: Omit<Template, "checklist"> & { checklist: unknown }): Template {
  return { ...row, checklist: checklistFromJson(row.checklist) };
}

export async function listTemplates({ category, archived }: { category?: TaskCategory; archived: boolean }) {
  const supabase = await createClient();
  let query = supabase.from("task_templates").select(TEMPLATE_FIELDS).eq("is_active", !archived).order("title");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(toTemplate);
}

// תבנית פעילה בלבד (ליצירת משימה). RLS מחזיר רק תבניות של הבעלים.
export async function getActiveTemplate(id: string): Promise<Template | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_templates")
    .select(TEMPLATE_FIELDS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  return data ? toTemplate(data) : null;
}

export async function listActiveTemplateOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_templates")
    .select("id, title, category")
    .eq("is_active", true)
    .order("title");
  return data ?? [];
}
