import { z } from "zod";

import { optionalNumber, optionalText, optionalUuid } from "@/features/shared/form";
import { NO_PRICING, normalizePricing, pricingFields, pricingRuleErrors } from "@/features/shared/pricing";
// tuples מילוליים, כדי שהטיפוס יתאים ל-enums של ה-DB
export const taskCategorySchema = z.enum(["clients", "marketing", "business", "personal"], "יש לבחור קטגוריה");
export const taskStatusSchema = z.enum(["todo", "in_progress", "waiting_client", "done"], "סטטוס לא תקין");
export const taskPrioritySchema = z.enum(["urgent", "normal", "low"], "עדיפות לא תקינה");

// "true"/"false" מבחירה בטופס. בלי ערך: ברירת המחדל
const formBoolean = (fallback: boolean) =>
  z.preprocess((v) => (v === "true" || v === true ? true : v === "false" || v === false ? false : fallback), z.boolean());

const dateSchema = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.iso.date("תאריך לא תקין").nullable(),
);

// שעה ביום היעד (שעון ישראל). מה-DB מגיע "HH:MM:SS", ומהטופס "HH:MM"
const timeSchema = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? v.slice(0, 5) : v),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "שעה לא תקינה").nullable(),
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

// פרויקט: לא במשימה אישית, ותמיד עם לקוח (הלקוח של הפרויקט נבדק ב-action וב-DB)
export function projectRuleErrors(task: { category: string; client_id: string | null; project_id: string | null }) {
  const errors: Record<string, string> = {};
  if (!task.project_id) return errors;
  if (task.category === "personal") errors.project_id = "משימה אישית לא שייכת לפרויקט";
  else if (!task.client_id) errors.project_id = "פרויקט שייך ללקוח. יש לבחור את הלקוח של הפרויקט";
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
    // עם שעה נוצר אירוע ביומן (טריגר ב-DB). תואם ל-CHECK tasks_time_needs_date
    due_time: timeSchema.default(null),
    estimate_minutes: optionalNumber(
      z.number("מספר לא תקין").int("מספר שלם בדקות").positive("הערכה חייבת להיות חיובית").max(100000, "הערכה גדולה מדי"),
    ),
    assignee_freelancer_id: optionalUuid,
    freelancer_cost: optionalNumber(z.number("מספר לא תקין").min(0, "עלות לא יכולה להיות שלילית")),
    project_id: optionalUuid.default(null),
    ...pricingFields,
    // משימה בפרויקט: חלק מהמחיר הכללי, או מחיר נפרד ללקוח
    project_share: optionalNumber(
      z.number("מספר לא תקין").min(0, "סכום לא יכול להיות שלילי").max(99999999, "סכום גדול מדי"),
    ).default(null),
    billed_separately: formBoolean(false),
    // עלות הפרילנסר יורדת מתקציב הפרויקט, או שהיא הוצאה נפרדת
    freelancer_cost_in_project: formBoolean(true),
  })
  .superRefine((task, ctx) => {
    const errors = { ...categoryRuleErrors(task), ...projectRuleErrors(task) };
    if (task.due_time && !task.due_date) errors.due_time = "שעה נקבעת רק עם תאריך יעד";
    // כללי התמחור חלים רק על משימה שמתומחרת בעצמה: בודדת, או בפרויקט במחיר נפרד
    if (ownPricing(task)) Object.assign(errors, pricingRuleErrors(task));
    for (const [path, message] of Object.entries(errors)) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  })
  // מאפס את מה שלא שייך למצב (בלי פרויקט / כלולה בפרויקט / נפרדת). תואם ל-CHECK ‏tasks_project_billing
  .transform((task) => {
    const inProject = Boolean(task.project_id) && task.category !== "personal";
    const separate = inProject && task.billed_separately;
    return {
      ...task,
      ...(ownPricing(task) ? normalizePricing(task) : NO_PRICING),
      project_share: inProject && !separate ? task.project_share : null,
      billed_separately: separate,
      freelancer_cost_in_project: inProject && task.assignee_freelancer_id ? task.freelancer_cost_in_project : true,
    };
  });

// משימה שמתומחרת בעצמה: לא אישית, ובלי פרויקט או בפרויקט במחיר נפרד
function ownPricing(task: { category: string; project_id: string | null; billed_separately: boolean }): boolean {
  if (task.category === "personal") return false;
  return !task.project_id || task.billed_separately;
}

export type TaskInput = z.output<typeof taskSchema>;

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
  // מזהה לקוח, או "self" = העסק שלי (שיווק ועסקיות בלי לקוח)
  client: z.union([z.guid(), z.literal("self")]).optional().catch(undefined),
  category: taskCategorySchema.optional().catch(undefined),
  status: z.union([taskStatusSchema, z.literal("open")]).optional().catch(undefined),
  freelancer: z.guid().optional().catch(undefined),
  project: z.guid().optional().catch(undefined),
  view: z.enum(["list", "board"]).optional().catch(undefined),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;
