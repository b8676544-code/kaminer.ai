import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// לקוח Supabase לשרת (Server Components, Server Actions, Route Handlers).
// פועל בהרשאות המשתמשת המחוברת, כך שה-RLS חל.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // נקרא מתוך Server Component, שבו אי אפשר לכתוב cookies. ה-proxy מרענן את הסשן.
          }
        },
      },
    },
  );
}
