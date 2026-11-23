import { z } from "zod";

import { optionalText } from "@/features/shared/form";
import { normalizePricing, pricingFields, pricingRuleErrors } from "@/features/shared/pricing";

export const projectStatusSchema = z.enum(["active", "done", "archived"], "סטטוס לא תקין");
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "פעיל",
  done: "הסתיים",
  archived: "בארכיון",
};

const optionalDate = z.preprocess((v) => (v === "" || v == null ? null : v), z.iso.date("תאריך לא תקין").nullable());

export const projectSchema = z
  .object({
    client_id: z.guid("יש לבחור לקוח"),
    name: z.string().trim().min(1, "שם הפרויקט חובה").max(200, "שם ארוך מדי"),
    description: optionalText,
    status: projectStatusSchema.default("active"),
    start_date: optionalDate.default(null),
    end_date: optionalDate.default(null),
    ...pricingFields,
  })
  .superRefine((p, ctx) => {
    if (p.start_date && p.end_date && p.end_date < p.start_date) {
      ctx.addIssue({ code: "custom", path: ["end_date"], message: "תאריך הסיום לפני תאריך ההתחלה" });
    }
    for (const [path, message] of Object.entries(pricingRuleErrors(p))) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  })
  .transform((p) => ({ ...p, ...normalizePricing(p) }));

export type ProjectInput = z.output<typeof projectSchema>;
