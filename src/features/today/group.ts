import { addDays } from "@/features/meetings/calendar-range";

// חלוקת המשימות למסך "היום שלי". טהור, כדי שאפשר יהיה לבדוק.
// תאריכים הם "yyyy-mm-dd" בשעון ירושלים.

export type TodayTaskBase = {
  id: string;
  status: string;
  priority: string;
  due_date: string | null;
  category: string;
  created_at?: string;
};

export const WEEK_AHEAD_DAYS = 7;

// לפי תאריך יעד, ובאותו תאריך הדחופות קודם
function byDueThenPriority<T extends TodayTaskBase>(a: T, b: T): number {
  const da = a.due_date ?? "9999-12-31";
  const db = b.due_date ?? "9999-12-31";
  if (da !== db) return da < db ? -1 : 1;
  return Number(b.priority === "urgent") - Number(a.priority === "urgent");
}

// ללא תאריך: הדחופות קודם, ואחריהן החדשות קודם
function byPriorityThenNewest<T extends TodayTaskBase>(a: T, b: T): number {
  const urgent = Number(b.priority === "urgent") - Number(a.priority === "urgent");
  if (urgent !== 0) return urgent;
  return (b.created_at ?? "").localeCompare(a.created_at ?? "");
}

// כל משימה מופיעה ברשימה אחת בלבד, לפי הסדר: להיום, בתהליך, ממתינות, השבוע, ללא תאריך
function groupSet<T extends TodayTaskBase>(open: T[], today: string) {
  const weekEnd = addDays(today, WEEK_AHEAD_DAYS);

  // "ממתין ללקוח" הוא הכדור אצל הלקוח, ולכן מוצג רק ברשימת המעקב
  const waiting = open.filter((t) => t.status === "waiting_client").sort(byDueThenPriority);
  const mine = open.filter((t) => t.status !== "waiting_client");

  const dueToday = mine.filter((t) => t.due_date !== null && t.due_date <= today).sort(byDueThenPriority);
  const shown = new Set(dueToday.map((t) => t.id));
  const inProgress = mine.filter((t) => t.status === "in_progress" && !shown.has(t.id)).sort(byDueThenPriority);
  for (const t of inProgress) shown.add(t.id);

  const upcoming = mine
    .filter((t) => !shown.has(t.id) && t.due_date !== null && t.due_date > today && t.due_date <= weekEnd)
    .sort(byDueThenPriority);
  const week: { day: string; tasks: T[] }[] = [];
  for (const t of upcoming) {
    const last = week.at(-1);
    if (last && last.day === t.due_date) last.tasks.push(t);
    else week.push({ day: t.due_date!, tasks: [t] });
  }

  const undated = mine.filter((t) => !shown.has(t.id) && t.due_date === null).sort(byPriorityThenNewest);

  return { dueToday, inProgress, waiting, week, undated };
}

export type TodayGroups<T extends TodayTaskBase> = ReturnType<typeof groupSet<T>>;

// משימות אישיות מופרדות לכרטיס משלהן בתחתית המסך, והרשימות העסקיות נשארות נקיות
export function groupTodayTasks<T extends TodayTaskBase>(tasks: T[], today: string) {
  const open = tasks.filter((t) => t.status !== "done");
  return {
    business: groupSet(
      open.filter((t) => t.category !== "personal"),
      today,
    ),
    personal: groupSet(
      open.filter((t) => t.category === "personal"),
      today,
    ),
  };
}

export const countGroups = (g: TodayGroups<TodayTaskBase>) =>
  g.dueToday.length + g.inProgress.length + g.waiting.length + g.undated.length +
  g.week.reduce((n, w) => n + w.tasks.length, 0);

// דקות עבודה היום: רישומים שהסתיימו לפי המשך שנשמר, והשעון הפתוח עד עכשיו
export function sumTodayMinutes(
  entries: { started_at: string; ended_at: string | null; duration_minutes: number | null; is_billable: boolean }[],
  nowMs: number,
): { total: number; billable: number } {
  let total = 0;
  let billable = 0;
  for (const e of entries) {
    const minutes =
      e.ended_at === null
        ? Math.max(0, Math.floor((nowMs - new Date(e.started_at).getTime()) / 60000))
        : (e.duration_minutes ?? 0);
    total += minutes;
    if (e.is_billable) billable += minutes;
  }
  return { total, billable };
}
