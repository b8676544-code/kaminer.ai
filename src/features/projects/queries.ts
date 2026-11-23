import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "./schemas";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// דקות לחיוב (רישומים שהסתיימו, is_billable) לפי פרויקט, דרך המשימות שלו
async function billableMinutesByProject(supabase: Supabase, projectIds: string[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (projectIds.length === 0) return totals;
  const { data, error } = await supabase
    .from("time_entries")
    .select("duration_minutes, tasks!inner(project_id)")
    .in("tasks.project_id", projectIds)
    .eq("is_billable", true)
    .not("ended_at", "is", null);
  if (error) throw error;
  for (const row of data) {
    const projectId = row.tasks.project_id;
    if (projectId) totals.set(projectId, (totals.get(projectId) ?? 0) + (row.duration_minutes ?? 0));
  }
  return totals;
}

const PROJECT_LIST_SELECT = "id, name, status, start_date, end_date, pricing_type, hourly_rate, final_price";

// כרטיס "פרויקטים" בדף הלקוח
export async function listClientProjects(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_LIST_SELECT)
    .eq("client_id", clientId)
    .order("status")
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  const minutes = await billableMinutesByProject(
    supabase,
    data.map((p) => p.id),
  );
  return data.map((p) => ({ ...p, billableMinutes: minutes.get(p.id) ?? 0 }));
}

export type ClientProject = Awaited<ReturnType<typeof listClientProjects>>[number];

// מסך "פרויקטים": כל הפרויקטים, עם לקוח, ספירת משימות ושעות לחיוב
export async function listProjects(status: ProjectStatus | "all") {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(`${PROJECT_LIST_SELECT}, client_id, clients(name), tasks(status)`)
    .order("end_date", { ascending: true, nullsFirst: false })
    .order("name");
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  const minutes = await billableMinutesByProject(
    supabase,
    data.map((p) => p.id),
  );
  return data.map(({ tasks, ...p }) => ({
    ...p,
    taskCount: tasks.length,
    openTaskCount: tasks.filter((t) => t.status !== "done").length,
    billableMinutes: minutes.get(p.id) ?? 0,
  }));
}

export type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

export async function getProject(id: string) {
  const supabase = await createClient();
  const [projectRes, tasksRes] = await Promise.all([
    supabase.from("projects").select("*, clients(id, name, hourly_rate)").eq("id", id).maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, estimate_minutes")
      .eq("project_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
  ]);
  if (projectRes.error) throw projectRes.error;
  if (!projectRes.data) return null;
  const minutes = await billableMinutesByProject(supabase, [id]);
  return { project: projectRes.data, tasks: tasksRes.data ?? [], billableMinutes: minutes.get(id) ?? 0 };
}

// פרויקטים פעילים לבחירה בטופס משימה (מסוננים בטופס לפי הלקוח)
export async function listProjectOptions(includeId?: string | null) {
  const supabase = await createClient();
  let query = supabase.from("projects").select("id, name, client_id").order("name");
  // includeId מגיע מה-DB (המשימה הנערכת), אבל נבדק בכל זאת לפני שנכנס לביטוי הסינון
  const safeId = includeId && /^[0-9a-f-]{36}$/i.test(includeId) ? includeId : null;
  query = safeId ? query.or(`status.eq.active,id.eq.${safeId}`) : query.eq("status", "active");
  const { data } = await query;
  return data ?? [];
}

export type ProjectOption = Awaited<ReturnType<typeof listProjectOptions>>[number];

// דקות לחיוב של משימה אחת (לכרטיס התמחור בדף המשימה)
export async function taskBillableMinutes(taskId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("duration_minutes")
    .eq("task_id", taskId)
    .eq("is_billable", true)
    .not("ended_at", "is", null);
  return (data ?? []).reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0);
}
