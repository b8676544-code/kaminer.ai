import { z } from "zod";

import { optionalNumber, optionalText } from "@/features/shared/form";
import { parseChecklistLines, taskCategorySchema } from "@/features/tasks/schemas";

// תבנית בקטלוג. תתי־המשימות מגיעים מ-textarea (שורה לכל אחת) ונשמרים כמערך jsonb.
export const templateSchema = z.object({
  title: z.string().trim().min(1, "כותרת חובה").max(300, "כותרת ארוכה מדי"),
  description: optionalText,
  category: taskCategorySchema,
  default_estimate_minutes: optionalNumber(
    z.number("מספר לא תקין").int("מספר שלם בדקות").positive("הערכה חייבת להיות חיובית").max(100000, "הערכה גדולה מדי"),
  ),
  checklist: z
    .string()
    .optional()
    .transform((v) => parseChecklistLines(v)),
});

export type TemplateInput = z.infer<typeof templateSchema>;

// checklist מה-DB הוא jsonb. מוודאים שזה באמת מערך מחרוזות.
export function checklistFromJson(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export const templateFiltersSchema = z.object({
  category: taskCategorySchema.optional().catch(undefined),
  archived: z
    .string()
    .optional()
    .transform((v) => v === "1")
    .catch(false),
});
