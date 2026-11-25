import "server-only";

import { addDays } from "@/features/meetings/calendar-range";
import { listMeetings } from "@/features/meetings/queries";
import { jerusalemToIso, todayInJerusalem } from "@/features/shared/format";
import { createClient } from "@/lib/supabase/server";
import { groupTodayTasks, sumTodayMinutes, WEEK_AHEAD_DAYS } from "./group";

const TASK_SELECT = "id, title, category, status, priority, due_date, due_time, created_at, clients(name)";

// כל הנתונים של "היום שלי" בבת אחת
export async function getTodayData() {
  const supabase = await createClient();
  // אחרי גישה ל-cookies (createClient), כך שמותר לקרוא לשעון ב-cacheComponents
  const nowMs = Date.now();
  const today = todayInJerusalem(new Date(nowMs));
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, WEEK_AHEAD_DAYS);
  const dayStart = jerusalemToIso(today, "00:00");

  const [tasksRes, meetings, entriesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .neq("status", "done")
      .or(`due_date.lte.${weekEnd},due_date.is.null,status.in.(in_progress,waiting_client)`)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(500),
    listMeetings(dayStart, jerusalemToIso(addDays(today, 2), "00:00")),
    supabase
      .from("time_entries")
      .select("started_at, ended_at, duration_minutes, is_billable")
      .gte("started_at", dayStart),
  ]);
  if (tasksRes.error) throw tasksRes.error;
  if (entriesRes.error) throw entriesRes.error;

  return {
    today,
    tomorrow,
    nowIso: new Date(nowMs).toISOString(),
    tasks: groupTodayTasks(tasksRes.data, today),
    meetings,
    minutes: sumTodayMinutes(entriesRes.data, nowMs),
  };
}

export type TodayData = Awaited<ReturnType<typeof getTodayData>>;
export type TodayTask = TodayData["tasks"]["business"]["dueToday"][number];
