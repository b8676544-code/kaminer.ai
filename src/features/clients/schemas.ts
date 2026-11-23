import { z } from "zod";

import { optionalNumber, optionalText } from "@/features/shared/form";

const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.email("כתובת מייל לא תקינה").nullable())
  .optional()
  .transform((v) => v ?? null);

// כתובת אתר: בלי פרוטוקול מוסיפים https://, ומקבלים רק http/https
export const optionalWebsite = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : /^https?:\/\//i.test(v) ? v : `https://${v}`))
  .pipe(
    z
      .url({
        protocol: /^https?$/,
        hostname: z.regexes.domain,
        error: "כתובת אתר לא תקינה",
      })
      .nullable(),
  )
  .optional()
  .transform((v) => v ?? null);

export const clientSchema = z.object({
  name: z.string().trim().min(1, "שם הלקוח חובה").max(200, "שם ארוך מדי"),
  contact_name: optionalText,
  phone: optionalText,
  mobile: optionalText,
  email: optionalEmail,
  website: optionalWebsite,
  notes: optionalText,
  hourly_rate: optionalNumber(z.number("מספר לא תקין").min(0, "תעריף לא יכול להיות שלילי")),
});

export type ClientInput = z.infer<typeof clientSchema>;

// איש קשר נוסף של לקוח
export const contactSchema = z.object({
  client_id: z.guid("לקוח לא תקין"),
  name: z.string().trim().min(1, "שם חובה").max(200, "שם ארוך מדי"),
  role: optionalText,
  mobile: optionalText,
  phone: optionalText,
  email: optionalEmail,
  notes: optionalText,
});

export type ContactInput = z.infer<typeof contactSchema>;
