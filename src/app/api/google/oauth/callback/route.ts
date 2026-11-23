import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { encryptToken } from "@/lib/google/crypto";
import { emailFromIdToken, exchangeCode } from "@/lib/google/oauth";
import { isValidOAuthState, OAUTH_STATE_COOKIE } from "@/lib/google/oauth-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// חזרה מ-Google: בודקים state, מחליפים code בטוקנים ושומרים את ה-refresh token מוצפן.
// בחירת היומן והסנכרון הראשון נעשים אחר כך במסך ההגדרות.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (result: string) => NextResponse.redirect(new URL(`/settings?google=${result}`, request.url));

  const cookieStore = await cookies();
  const expected = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete({ name: OAUTH_STATE_COOKIE, path: "/api/google/oauth" });

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", request.url));

  if (url.searchParams.get("error")) return back("denied");
  if (!isValidOAuthState(expected, url.searchParams.get("state"))) return back("invalid_state");
  const code = url.searchParams.get("code");
  if (!code) return back("error");

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) return back("no_refresh_token");

    const admin = createAdminClient();
    const { error } = await admin.from("calendar_connections").upsert(
      {
        user_id: data.user.id,
        google_email: emailFromIdToken(tokens.id_token),
        refresh_token: encryptToken(tokens.refresh_token),
        calendar_id: "primary",
        calendar_name: null,
        calendar_selected_at: null,
        sync_token: null,
        last_sync_error: null,
        sync_lock_until: null,
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  } catch (e) {
    console.error("[google-oauth]", e);
    return back("error");
  }
  return back("connected");
}
