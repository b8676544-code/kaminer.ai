import { NextResponse } from "next/server";

import { syncCalendar } from "@/lib/google/sync";
import { createClient } from "@/lib/supabase/server";

// סנכרון ברקע מהדפדפן (בכניסה וכל כמה דקות). יש throttle בתוך syncCalendar.
export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await syncCalendar(data.user.id);
  return NextResponse.json(result);
}
