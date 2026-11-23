import "server-only";

import { createClient } from "@/lib/supabase/server";
import { projectBudget } from "./budget";
import type { ProjectStatus } from "./schemas";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// דקות לחיוב (רישומים שהסתיימו, is_billable) לפי פרויקט, דרך המשימות שלו
async function billableMinutesByProject(supabase: Supabase, projectIds: string[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (projectIds.length === 0) return totals;
  const { data, error } = await supabase
    .from("time_entries")
    .select("duration_minutes, tasks!inner(project_id, billed_separately)")
    .in("tasks.project_id", projectIds)
    // משימה במחיר נפרד מחויבת בעצמה, ולכן השעות שלה לא נכנסות למחיר הפרויקט
    .eq("tasks.billed_separately", false)
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
      .select(
        "id, title, status, priority, due_date, estimate_minutes, project_share, billed_separately, pricing_type, hourly_rate, final_price, assignee_freelancer_id, freelancer_cost, freelancer_cost_in_project, freelancers(full_name)",
      )
      .eq("project_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
  ]);
  if (projectRes.error) throw projectRes.error;
  if (!projectRes.data) return null;
  if (tasksRes.error) throw tasksRes.error;
  const taskIds = tasksRes.data.map((t) => t.id);
  const [minutes, byTask] = await Promise.all([
    billableMinutesByProject(supabase, [id]),
    billableMinutesByTask(supabase, taskIds),
  ]);
  const tasks = tasksRes.data.map((t) => ({ ...t, billableMinutes: byTask.get(t.id) ?? 0 }));
  const billableMinutes = minutes.get(id) ?? 0;
  return {
    project: projectRes.data,
    tasks,
    billableMinutes,
    budget: projectBudget({ ...projectRes.data, billableMinutes }, tasks),
  };
}

// דקות לחיוב לכל משימה (לחיוב נפרד לפי שעה)
async function billableMinutesByTask(supabase: Supabase, taskIds: string[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (taskIds.length === 0) return totals;
  const { data, error } = await supabase
    .from("time_entries")
    .select("task_id, duration_minutes")
    .in("task_id", taskIds)
    .eq("is_billable", true)
    .not("ended_at", "is", null);
  if (error) throw error;
  for (const row of data) totals.set(row.task_id, (totals.get(row.task_id) ?? 0) + (row.duration_minutes ?? 0));
  return totals;
}

// פרויקטים פעילים לבחירה בטופס משימה (מסוננים בטופס לפי הלקוח)
export async function listProjectOptions(includeId?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("id, name, client_id, final_price, tasks(id, project_share, billed_separately)")
    .order("name");
  // includeId מגיע מה-DB (המשימה הנערכת), אבל נבדק בכל זאת לפני שנכנס לביטוי הסינון
  const safeId = includeId && /^[0-9a-f-]{36}$/i.test(includeId) ? includeId : null;
  query = safeId ? query.or(`status.eq.active,id.eq.${safeId}`) : query.eq("status", "active");
  const { data } = await query;
  return (data ?? []).map(({ tasks, final_price, ...p }) => ({
    ...p,
    // המחיר הכללי: גלובלי, או סופי שנקבע בתמחור לפי שעה
    price: final_price == null ? null : Number(final_price),
    shares: tasks
      .filter((t) => !t.billed_separately && t.project_share != null)
      .map((t) => ({ task_id: t.id, share: Number(t.project_share) })),
  }));
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
