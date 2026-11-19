"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; info?: string };

const emailSchema = z.email("כתובת מייל לא תקינה");

export async function signInWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "יש להזין סיסמה") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // הודעה כללית, בלי לחשוף אם המייל קיים
  if (error) return { error: "המייל או הסיסמה שגויים" };

  redirect("/");
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email: parsed.data,
    // אין הרשמה: קישור נשלח רק למשתמשת קיימת
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` },
  });

  // אותה תשובה בכל מקרה, כדי לא לחשוף אילו מיילים רשומים
  return { info: "אם המייל רשום במערכת, נשלח אליו קישור כניסה." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
