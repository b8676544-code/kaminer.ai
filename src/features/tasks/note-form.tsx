"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/features/shared/form";
import { addNote } from "./actions";

export function NoteForm({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addNote, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-2">
      <input type="hidden" name="task_id" value={taskId} />
      <Textarea name="body" rows={2} placeholder="הערה חדשה…" aria-label="הערה חדשה" maxLength={5000} required />
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "שומרת…" : "הוספת הערה"}
      </Button>
    </form>
  );
}
