import "server-only";
import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type RunningTimer = {
  id: string;
  taskId: string;
  taskTitle: string;
  startedAt: string;
};

// השעון הרץ של המשתמשת המחוברת (אחד לכל היותר, לפי אינדקס ייחודי ב-DB).
// React.cache: הכותרת והעמוד קוראים לזה באותה בקשה, והשאילתה רצה פעם אחת.
export const getRunningTimer = cache(async (): Promise<RunningTimer | null> => {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, task_id, started_at, tasks(title)")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, taskId: data.task_id, taskTitle: data.tasks?.title ?? "", startedAt: data.started_at };
});
