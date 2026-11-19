"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithPassword, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(signInWithPassword, {
    error: initialError,
  });
  const [mlState, mlAction, mlPending] = useActionState<LoginState, FormData>(sendMagicLink, {});
  const state = mode === "password" ? pwState : mlState;

  return (
    <form action={mode === "password" ? pwAction : mlAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">מייל</Label>
        <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </div>

      {mode === "password" && (
        <div className="grid gap-2">
          <Label htmlFor="password">סיסמה</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state.info && (
        <p role="status" className="text-sm text-emerald-700">
          {state.info}
        </p>
      )}

      {mode === "password" ? (
        <Button type="submit" disabled={pwPending}>
          {pwPending ? "מתחברת…" : "כניסה"}
        </Button>
      ) : (
        <Button type="submit" disabled={mlPending}>
          {mlPending ? "שולחת…" : "שלחי לי קישור כניסה"}
        </Button>
      )}

      <Button
        type="button"
        variant="link"
        className="h-auto p-0"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
      >
        {mode === "password" ? "כניסה עם קישור במייל, בלי סיסמה" : "כניסה עם סיסמה"}
      </Button>
    </form>
  );
}
