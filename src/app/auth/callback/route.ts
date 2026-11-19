import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// חזרה מקישור קסם (PKCE): מחליף את ה-code בסשן ומעביר ליעד.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // רק נתיב פנימי, כדי למנוע open redirect
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
