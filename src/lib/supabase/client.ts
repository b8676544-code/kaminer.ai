import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// לקוח Supabase לדפדפן (Client Components). מפתח anon בלבד, ה-RLS חל.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
