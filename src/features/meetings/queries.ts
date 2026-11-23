import "server-only";

import { createClient } from "@/lib/supabase/server";

const MEETING_SELECT =
  "id, title, starts_at, ends_at, is_all_day, is_personal, source, client_id, task_id, location, notes, invite_emails, clients(name), tasks(title, status), time_entries(id)";

// פגישות שנוגעות בטווח [from, to). פגישות שנמחקו (מחיקה רכה) לא מוצגות
export async function listMeetings(from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .is("deleted_at", null)
    .lt("starts_at", to)
    .gt("ends_at", from)
    .order("starts_at")
    .limit(1000);
  if (error) throw error;
  return data.map(({ time_entries, ...m }) => ({ ...m, loggedCount: time_entries.length }));
}

export type MeetingItem = Awaited<ReturnType<typeof listMeetings>>[number];

// לדף הלקוח: הפגישות הקרובות והאחרונות שעברו
export async function listClientMeetings(clientId: string) {
  const supabase = await createClient();
  // אחרי גישה ל-cookies (createClient), כך שמותר לקרוא לשעון ב-cacheComponents
  const now = new Date().toISOString();
  const base = () =>
    supabase
      .from("meetings")
      .select("id, title, starts_at, ends_at, is_all_day")
      .eq("client_id", clientId)
      .is("deleted_at", null);

  const [upcomingRes, pastRes] = await Promise.all([
    base().gte("ends_at", now).order("starts_at").limit(5),
    base().lt("ends_at", now).order("starts_at", { ascending: false }).limit(5),
  ]);
  if (upcomingRes.error) throw upcomingRes.error;
  if (pastRes.error) throw pastRes.error;
  return { upcoming: upcomingRes.data, past: pastRes.data };
}

export type ClientMeeting = Awaited<ReturnType<typeof listClientMeetings>>["upcoming"][number];

// כתובות להזמנה לפגישה: המייל של הלקוח ושל אנשי הקשר שלו (לקוחות פעילים)
export async function listInviteContacts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, client_contacts(name, email)")
    .eq("status", "active");
  if (error) throw error;
  return data.flatMap((c) => [
    ...(c.email ? [{ client_id: c.id, name: c.name, email: c.email.toLowerCase() }] : []),
    ...c.client_contacts
      .filter((p) => p.email)
      .map((p) => ({ client_id: c.id, name: p.name, email: p.email!.toLowerCase() })),
  ]);
}

export type InviteContact = Awaited<ReturnType<typeof listInviteContacts>>[number];

// משימות פתוחות לבחירה בטופס פגישה וברישום זמן
export async function listOpenTaskOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, client_id")
    .neq("status", "done")
    .order("title")
    .limit(500);
  if (error) throw error;
  return data;
}

export type TaskOption = Awaited<ReturnType<typeof listOpenTaskOptions>>[number];
