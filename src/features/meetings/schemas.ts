import { z } from "zod";

import { optionalText, optionalUuid } from "@/features/shared/form";
import { jerusalemToIso } from "@/features/shared/format";
import { timeEntrySchema } from "@/features/time/schemas";

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "שעה לא תקינה");

// שדות השיוך והפרטים, משותפים לפגישה עם שעות ולאירוע של יום שלם
const meetingDetails = {
  client_id: optionalUuid,
  task_id: optionalUuid,
  location: optionalText,
  notes: optionalText,
};

// פגישה מהטופס: תאריך ושעות בשעון ירושלים, הפלט ב-UTC.
// הטופס מגביל ליום אחד. ה-DB עצמו מקבל גם פגישה שחוצה חצות (אירועים מ-Google).
export const meetingSchema = z
  .object({
    title: z.string().trim().min(1, "כותרת חובה").max(200, "עד 200 תווים"),
    date: z.iso.date("תאריך לא תקין"),
    start: timeOfDay,
    end: timeOfDay,
    ...meetingDetails,
  })
  .superRefine((v, ctx) => {
    if (v.end <= v.start) {
      ctx.addIssue({ code: "custom", path: ["end"], message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה" });
    }
  })
  .transform(({ date, start, end, ...rest }) => ({
    title: rest.title,
    starts_at: jerusalemToIso(date, start),
    ends_at: jerusalemToIso(date, end),
    client_id: rest.client_id,
    task_id: rest.task_id,
    location: rest.location,
    notes: rest.notes,
  }));

export type MeetingInput = z.output<typeof meetingSchema>;

// אירוע של יום שלם (מגיע מ-Google): הזמנים לא נערכים במערכת, רק הכותרת, השיוך והפרטים
export const allDayMeetingSchema = z.object({
  title: z.string().trim().min(1, "כותרת חובה").max(200, "עד 200 תווים"),
  ...meetingDetails,
});

// "רשום כזמן עבודה": רישום זמן ידני על משימה, מקושר לפגישה
export const logWorkSchema = z
  .object({
    meeting_id: z.guid("מזהה פגישה לא תקין"),
    task_id: z.guid("יש לבחור משימה"),
  })
  .and(timeEntrySchema)
  .transform((v) => ({
    meeting_id: v.meeting_id,
    task_id: v.task_id,
    started_at: v.started_at,
    ended_at: v.ended_at,
    note: v.note,
  }));

// משך ברירת מחדל לפגישה חדשה
export const DEFAULT_MEETING_MINUTES = 60;
