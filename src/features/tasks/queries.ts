import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TaskFilters } from "./schemas";

const LIST_SELECT =
  "id, title, category, status, priority, due_date, estimate_minutes, client_id, assignee_freelancer_id, clients(name), freelancers(full_name)";

export async function listTasks(filters: TaskFilters) {
  const supabase = await createClient();
  let query = supabase.from("tasks").select(LIST_SELECT);

  if (filters.client) query = query.eq("client_id", filters.client);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.freelancer) query = query.eq("assignee_freelancer_id", filters.freelancer);
  if (filters.status === "open") query = query.neq("status", "done");
  else if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

export type TaskListItem = Awaited<ReturnType<typeof listTasks>>[number];

export async function getTask(id: string) {
  const supabase = await createClient();
  const [taskRes, checklistRes, notesRes, summaryRes, entriesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, clients(id, name), freelancers(id, full_name), task_templates(id, title)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("task_checklist_items").select("id, text, is_done, position").eq("task_id", id).order("position"),
    supabase
      .from("task_notes")
      .select("id, body, created_at, profiles(full_name)")
      .eq("task_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("task_time_summary").select("actual_minutes, overrun_percent").eq("task_id", id).maybeSingle(),
    supabase
      .from("time_entries")
      .select("id, started_at, ended_at, duration_minutes, is_manual, note")
      .eq("task_id", id)
      .order("started_at", { ascending: false })
      .limit(50),
  ]);
  if (taskRes.error) throw taskRes.error;
  if (!taskRes.data) return null;

  return {
    task: taskRes.data,
    checklist: checklistRes.data ?? [],
    notes: notesRes.data ?? [],
    actualMinutes: summaryRes.data?.actual_minutes ?? 0,
    overrunPercent: summaryRes.data?.overrun_percent ?? null,
    timeEntries: entriesRes.data ?? [],
  };
}

export type TaskDetails = NonNullable<Awaited<ReturnType<typeof getTask>>>;
