import { z } from "zod";

import { optionalNumber, optionalText } from "@/features/shared/form";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "שם הלקוח חובה").max(200, "שם ארוך מדי"),
  contact_name: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.email("כתובת מייל לא תקינה").nullable())
    .optional()
    .transform((v) => v ?? null),
  notes: optionalText,
  hourly_rate: optionalNumber(z.number("מספר לא תקין").min(0, "תעריף לא יכול להיות שלילי")),
});

export type ClientInput = z.infer<typeof clientSchema>;
