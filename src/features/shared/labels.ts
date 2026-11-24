import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];
export type TaskCategory = Enums["task_category"];
export type TaskStatus = Enums["task_status"];
export type TaskPriority = Enums["task_priority"];
export type ClientStatus = Enums["client_status"];

export const TASK_CATEGORIES: TaskCategory[] = ["clients", "marketing", "business", "personal"];
export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "waiting_client", "done"];
export const TASK_PRIORITIES: TaskPriority[] = ["urgent", "normal", "low"];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  clients: "לקוחות",
  marketing: "שיווק",
  business: "עסקיות",
  personal: "אישיות",
};

// משימת שיווק או עסקית בלי לקוח היא של העסק עצמו ("כביכול אני הלקוח")
export const OWN_BUSINESS_LABEL = "העסק שלי";
export const OWN_BUSINESS_CATEGORIES: TaskCategory[] = ["marketing", "business"];
export const OWN_BUSINESS_FILTER = "self";

export const isOwnBusinessCategory = (category: string) => (OWN_BUSINESS_CATEGORIES as string[]).includes(category);

// מה להציג במקום הלקוח: שם הלקוח, "העסק שלי", או null (לקוחות בלי לקוח, אישיות)
export function clientLabel(category: string, clientName: string | null | undefined): string | null {
  if (clientName) return clientName;
  return isOwnBusinessCategory(category) ? OWN_BUSINESS_LABEL : null;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "לביצוע",
  in_progress: "בתהליך",
  waiting_client: "ממתין ללקוח",
  done: "הושלם",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "דחופה",
  normal: "רגילה",
  low: "נמוכה",
};

export const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  waiting_client: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  normal: "bg-transparent text-muted-foreground",
  low: "bg-transparent text-muted-foreground/70",
};
