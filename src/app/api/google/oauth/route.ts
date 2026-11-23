import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createOAuthState, OAUTH_STATE_COOKIE } from "@/lib/google/oauth-state";
import { buildAuthUrl, isGoogleConfigured } from "@/lib/google/oauth";
import { createClient } from "@/lib/supabase/server";

// התחלת החיבור ל-Google: יוצרים state (הגנת CSRF) ומפנים למסך ההרשאה
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", request.url));
  if (!isGoogleConfigured()) return NextResponse.redirect(new URL("/settings?google=not_configured", request.url));

  const state = createOAuthState();
  (await cookies()).set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/google/oauth",
    maxAge: 600,
  });
  return NextResponse.redirect(buildAuthUrl(state));
}
