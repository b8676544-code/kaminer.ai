import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null; fullName: string | null };

// Data Access Layer: מקור אחד לזיהוי המשתמשת המחוברת. נקרא מתוך <Suspense>
// (קורא cookies). React.cache מונע קריאה כפולה באותה בקשה.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return { id: data.user.id, email: data.user.email ?? null, fullName: profile?.full_name ?? null };
});

// ל-Server Actions: מאמת שוב בכל פעולה ומחזיר לקוח מחובר.
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}
