import { z } from "zod";

import { optionalText, optionalUuid } from "@/features/shared/form";
import { jerusalemToIso } from "@/features/shared/format";
import { timeEntrySchema } from "@/features/time/schemas";

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "שעה לא תקינה");

// מוזמנים במייל: מחרוזת כתובות מופרדות בפסיק, נקודה־פסיק או רווח. בלי השדה בטופס: לא משנים (undefined)
const inviteEmails = z.preprocess(
  (v) =>
    typeof v === "string"
      ? [
          ...new Set(
            v
              .split(/[\s,;]+/)
              .map((e) => e.trim().toLowerCase())
              .filter(Boolean),
          ),
        ]
      : undefined,
  z.array(z.email("כתובת מייל לא תקינה")).max(30, "עד 30 מוזמנים").optional(),
);

// פגישה אישית לא נשלחת למוזמנים
const invitesFor = (isPersonal: boolean, emails: string[] | undefined) =>
  emails === undefined ? undefined : isPersonal ? [] : emails;

// שדות השיוך והפרטים, משותפים לפגישה עם שעות ולאירוע של יום שלם
const meetingDetails = {
  // "true" מהטופס = פגישה אישית (משפחה, רופא וכד'). ברירת מחדל: עסקית
  is_personal: z.preprocess((v) => v === "true" || v === true, z.boolean()),
  client_id: optionalUuid,
  task_id: optionalUuid,
  location: optionalText,
  notes: optionalText,
  invite_emails: inviteEmails,
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
    is_personal: rest.is_personal,
    // פגישה אישית לא משויכת ללקוח
    client_id: rest.is_personal ? null : rest.client_id,
    task_id: rest.task_id,
    location: rest.location,
    notes: rest.notes,
    invite_emails: invitesFor(rest.is_personal, rest.invite_emails),
  }));

export type MeetingInput = z.output<typeof meetingSchema>;

// אירוע של יום שלם (מגיע מ-Google): הזמנים לא נערכים במערכת, רק הכותרת, השיוך והפרטים
export const allDayMeetingSchema = z
  .object({
    title: z.string().trim().min(1, "כותרת חובה").max(200, "עד 200 תווים"),
    ...meetingDetails,
  })
  .transform((v) => ({
    ...v,
    client_id: v.is_personal ? null : v.client_id,
    invite_emails: invitesFor(v.is_personal, v.invite_emails),
  }));

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
