import "server-only";

import { listCalendars, type CalendarOption } from "@/lib/google/calendar";
import { isGoogleConfigured } from "@/lib/google/oauth";
import { getAccessTokenForUser } from "@/lib/google/sync";
import { createClient } from "@/lib/supabase/server";

// סטטוס החיבור מה-view (בלי טוקנים). null = לא מחוברת
export async function getGoogleConnection() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("calendar_connection_status").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export type GoogleConnection = NonNullable<Awaited<ReturnType<typeof getGoogleConnection>>>;

export function googleConfigured() {
  return isGoogleConfigured();
}

// היומנים בחשבון, לבחירה אחרי החיבור. שגיאה מוחזרת כטקסט ולא נזרקת
export async function listGoogleCalendars(
  userId: string,
): Promise<{ calendars: CalendarOption[] } | { error: string }> {
  try {
    const token = await getAccessTokenForUser(userId);
    if (!token) return { error: "אין חיבור ל-Google" };
    return { calendars: await listCalendars(token) };
  } catch (e) {
    console.error("[google-calendars]", e);
    return { error: e instanceof Error ? e.message : "לא הצלחנו לטעון את היומנים" };
  }
}
