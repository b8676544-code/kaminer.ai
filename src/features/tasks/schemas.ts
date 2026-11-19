import { z } from "zod";

import { optionalNumber, optionalText, optionalUuid } from "@/features/shared/form";
// tuples מילוליים, כדי שהטיפוס יתאים ל-enums של ה-DB
export const taskCategorySchema = z.enum(["clients", "marketing", "business", "personal"], "יש לבחור קטגוריה");
export const taskStatusSchema = z.enum(["todo", "in_progress", "waiting_client", "done"], "סטטוס לא תקין");
export const taskPrioritySchema = z.enum(["urgent", "normal", "low"], "עדיפות לא תקינה");

const dateSchema = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.iso.date("תאריך לא תקין").nullable(),
);

// כללי קטגוריה, תואמים ל-CHECK ב-DB:
// "לקוחות" מחייבת לקוח; "אישיות" בלי לקוח, בלי פרילנסר ובלי עלות.
export function categoryRuleErrors(task: {
  category: string;
  client_id: string | null;
  assignee_freelancer_id: string | null;
  freelancer_cost: number | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (task.category === "clients" && !task.client_id) {
    errors.client_id = "במשימה בקטגוריית לקוחות חובה לבחור לקוח";
  }
  if (task.category === "personal") {
    if (task.client_id) errors.client_id = "משימה אישית לא משויכת ללקוח";
    if (task.assignee_freelancer_id) errors.assignee_freelancer_id = "משימה אישית לא משויכת לפרילנסר";
    if (task.freelancer_cost != null) errors.freelancer_cost = "משימה אישית בלי עלות פרילנסר";
  }
  if (task.freelancer_cost != null && !task.assignee_freelancer_id) {
    errors.freelancer_cost ??= "עלות נרשמת רק כשיש פרילנסר";
  }
  return errors;
}

export const taskSchema = z
  .object({
    title: z.string().trim().min(1, "כותרת חובה").max(300, "כותרת ארוכה מדי"),
    description: optionalText,
    category: taskCategorySchema,
    client_id: optionalUuid,
    status: taskStatusSchema.default("todo"),
    priority: taskPrioritySchema.default("normal"),
    due_date: dateSchema,
    estimate_minutes: optionalNumber(
      z.number("מספר לא תקין").int("מספר שלם בדקות").positive("הערכה חייבת להיות חיובית").max(100000, "הערכה גדולה מדי"),
    ),
    assignee_freelancer_id: optionalUuid,
    freelancer_cost: optionalNumber(z.number("מספר לא תקין").min(0, "עלות לא יכולה להיות שלילית")),
  })
  .superRefine((task, ctx) => {
    for (const [path, message] of Object.entries(categoryRuleErrors(task))) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  });

export type TaskInput = z.infer<typeof taskSchema>;

// תתי־משימות מטופס יצירה: שורה לכל פריט
export function parseChecklistLines(text: string | undefined): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 50);
}

// סינון רשימת המשימות מתוך ה-URL. ערך לא מוכר פשוט מתעלמים ממנו.
export const taskFiltersSchema = z.object({
  client: z.guid().optional().catch(undefined),
  category: taskCategorySchema.optional().catch(undefined),
  status: z.union([taskStatusSchema, z.literal("open")]).optional().catch(undefined),
  freelancer: z.guid().optional().catch(undefined),
  view: z.enum(["list", "board"]).optional().catch(undefined),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;
