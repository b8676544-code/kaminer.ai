import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function listFreelancers() {
  const supabase = await createClient();
  const [freelancersRes, tasksRes] = await Promise.all([
    supabase
      .from("freelancers")
      .select("id, full_name, email, phone, specialty, default_hourly_cost, notes, is_active")
      .order("is_active", { ascending: false })
      .order("full_name"),
    supabase.from("tasks").select("assignee_freelancer_id").neq("status", "done").not("assignee_freelancer_id", "is", null),
  ]);
  if (freelancersRes.error) throw freelancersRes.error;

  const openCount = new Map<string, number>();
  for (const t of tasksRes.data ?? []) {
    const id = t.assignee_freelancer_id;
    if (id) openCount.set(id, (openCount.get(id) ?? 0) + 1);
  }
  return freelancersRes.data.map((f) => ({ ...f, openTasks: openCount.get(f.id) ?? 0 }));
}

// לבחירה בטופס משימה: רק פעילים
export async function listActiveFreelancerOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("freelancers")
    .select("id, full_name, default_hourly_cost")
    .eq("is_active", true)
    .order("full_name");
  return data ?? [];
}
