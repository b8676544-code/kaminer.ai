import { z } from "zod";

import { optionalText } from "@/features/shared/form";
import { jerusalemToIso } from "@/features/shared/format";

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "שעה לא תקינה");

// רישום ידני או עריכה: תאריך, שעת התחלה ושעת סיום בשעון ירושלים.
// הפלט הוא timestamps ב-UTC, ו-duration_minutes מחושב ב-DB.
export const timeEntrySchema = z
  .object({
    date: z.iso.date("תאריך לא תקין"),
    start: timeOfDay,
    end: timeOfDay,
    note: optionalText,
  })
  .superRefine((v, ctx) => {
    if (v.end <= v.start) {
      ctx.addIssue({ code: "custom", path: ["end"], message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה" });
    }
  })
  .transform((v) => ({
    started_at: jerusalemToIso(v.date, v.start),
    ended_at: jerusalemToIso(v.date, v.end),
    note: v.note,
  }));

export type TimeEntryInput = z.output<typeof timeEntrySchema>;

// השעה שעד אליה מסתיים הזמן בשעון שנשכח (dialog עצירה אחרי 8 שעות)
export const stopAtSchema = z
  .object({ date: z.iso.date("תאריך לא תקין"), time: timeOfDay })
  .transform((v) => jerusalemToIso(v.date, v.time));

// אחרי כמה שעות שעון רץ מסומן כ"נשכח"
export const FORGOTTEN_TIMER_HOURS = 8;
