import { z } from "zod";

import { optionalNumber, optionalText } from "@/features/shared/form";

export const freelancerSchema = z.object({
  full_name: z.string().trim().min(1, "שם חובה").max(200, "שם ארוך מדי"),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.email("כתובת מייל לא תקינה").nullable())
    .optional()
    .transform((v) => v ?? null),
  phone: optionalText,
  specialty: optionalText,
  default_hourly_cost: optionalNumber(z.number("מספר לא תקין").min(0, "עלות לא יכולה להיות שלילית")),
  notes: optionalText,
});

export type FreelancerInput = z.infer<typeof freelancerSchema>;
