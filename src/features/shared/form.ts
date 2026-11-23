import { z } from "zod";

// תוצאה של Server Action שמוצגת בטופס
export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
  // ערכי הטופס שנשלחו, להחזרה לשדות אחרי שגיאה (React 19 מאפס את הטופס)
  values?: Record<string, string>;
};

// שדה טקסט אופציונלי: מחרוזת ריקה הופכת ל-null
export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

// מספר אופציונלי מטופס (מחרוזת ריקה = null)
export const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v == null ? null : Number(v)), schema.nullable());

// uuid אופציונלי מ-select ("" = ללא)
export const optionalUuid = z.preprocess((v) => (v === "" || v == null ? null : v), z.guid().nullable());

export function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) obj[key] = value;
  }
  return obj;
}

export function zodToState(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { error: "יש לתקן את השדות המסומנים", fieldErrors };
}

// הודעת שגיאה ידידותית מ-Postgres/PostgREST, בלי לחשוף פרטים פנימיים
export function dbErrorMessage(error: { code?: string; message?: string } | null): string {
  if (!error) return "שגיאה לא צפויה";
  if (error.code === "23514") return "הנתונים לא עומדים בכללי המערכת (למשל לקוח חובה בקטגוריית לקוחות)";
  if (error.code === "23503") return "אי אפשר לבצע: הרשומה מקושרת לרשומות אחרות";
  if (error.code === "42501") return "אין הרשאה לפעולה הזו";
  return "השמירה נכשלה. נסי שוב";
}
