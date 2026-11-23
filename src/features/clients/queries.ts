import "server-only";

import { currentMonthStart } from "@/features/shared/format";
import type { ClientStatus } from "@/features/shared/labels";
import { createClient } from "@/lib/supabase/server";

export async function listClients(status: ClientStatus) {
  const supabase = await createClient();
  const month = currentMonthStart();

  const [clientsRes, openTasksRes, hoursRes] = await Promise.all([
    supabase.from("clients").select("id, name, contact_name, phone, email, status").eq("status", status).order("name"),
    supabase.from("tasks").select("client_id").neq("status", "done").not("client_id", "is", null),
    supabase.from("client_monthly_hours").select("client_id, total_minutes").eq("month", month),
  ]);
  if (clientsRes.error) throw clientsRes.error;

  const openCount = new Map<string, number>();
  for (const t of openTasksRes.data ?? []) {
    if (t.client_id) openCount.set(t.client_id, (openCount.get(t.client_id) ?? 0) + 1);
  }
  const minutes = new Map((hoursRes.data ?? []).map((h) => [h.client_id, h.total_minutes ?? 0]));

  return clientsRes.data.map((c) => ({
    ...c,
    openTasks: openCount.get(c.id) ?? 0,
    monthMinutes: minutes.get(c.id) ?? 0,
  }));
}

export async function getClientDetails(id: string) {
  const supabase = await createClient();
  const [clientRes, tasksRes, hoursRes, contactsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, category, completed_at, projects(name)")
      .eq("client_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("client_monthly_hours")
      .select("month, total_minutes, billable_minutes")
      .eq("client_id", id)
      .order("month", { ascending: false })
      .limit(12),
    supabase
      .from("client_contacts")
      .select("id, name, role, mobile, phone, email, notes")
      .eq("client_id", id)
      .order("created_at"),
  ]);
  if (clientRes.error) throw clientRes.error;
  if (!clientRes.data) return null;

  const tasks = tasksRes.data ?? [];
  return {
    client: clientRes.data,
    openTasks: tasks.filter((t) => t.status !== "done"),
    doneTasks: tasks.filter((t) => t.status === "done"),
    monthlyHours: hoursRes.data ?? [],
    contacts: contactsRes.data ?? [],
  };
}

// רשימה קצרה לבחירה בטופס משימה
export async function listActiveClientOptions(includeId?: string | null) {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name, hourly_rate").eq("status", "active").order("name");
  const options = data ?? [];
  // לקוח בארכיון שנבחר במפורש (למשל ממשימה בפרויקט שלו) נשאר ברשימה
  const safeId = includeId && /^[0-9a-f-]{36}$/i.test(includeId) ? includeId : null;
  if (safeId && !options.some((c) => c.id === safeId)) {
    const { data: extra } = await supabase
      .from("clients")
      .select("id, name, hourly_rate")
      .eq("id", safeId)
      .maybeSingle();
    if (extra) options.push({ ...extra, name: `${extra.name} (ארכיון)` });
  }
  return options;
}
