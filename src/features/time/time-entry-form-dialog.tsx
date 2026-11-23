"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import { isoToJerusalem } from "@/features/shared/format";
import { saveTimeEntry } from "./actions";

export type TimeEntryValues = {
  id: string;
  started_at: string;
  ended_at: string;
  note: string | null;
};

// הוספה ידנית ("עבדתי אתמול 10:00–11:30") או תיקון רישום קיים
export function TimeEntryFormDialog({
  taskId,
  entry,
  trigger,
}: {
  taskId: string;
  entry?: TimeEntryValues;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "עריכת רישום זמן" : "הוספת זמן ידנית"}</DialogTitle>
          <DialogDescription>השעות לפי שעון ישראל. המשך מחושב אוטומטית.</DialogDescription>
        </DialogHeader>
        {open && <TimeEntryForm taskId={taskId} entry={entry} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TimeEntryForm({ taskId, entry, onDone }: { taskId: string; entry?: TimeEntryValues; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTimeEntry, {});
  const fe = state.fieldErrors ?? {};
  const start = entry ? isoToJerusalem(entry.started_at) : null;
  const end = entry ? isoToJerusalem(entry.ended_at) : null;
  const [today] = useState(() => isoToJerusalem(new Date().toISOString()).date);
  const v = state.values;

  useEffect(() => {
    if (state.ok) {
      toast.success(entry ? "הרישום עודכן" : "הזמן נוסף");
      onDone();
    }
  }, [state, entry, onDone]);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="task_id" value={taskId} />
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <Field id="entry-date" label="תאריך" error={fe.date} required>
        <Input name="date" type="date" dir="ltr" defaultValue={v?.date ?? start?.date ?? today} max={today} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="entry-start" label="משעה" error={fe.start} required>
          <Input name="start" type="time" dir="ltr" defaultValue={v?.start ?? start?.time} required />
        </Field>
        <Field id="entry-end" label="עד שעה" error={fe.end} required>
          <Input name="end" type="time" dir="ltr" defaultValue={v?.end ?? end?.time} required />
        </Field>
      </div>
      <Field id="entry-note" label="הערה" error={fe.note}>
        <Input name="note" defaultValue={v?.note ?? entry?.note ?? ""} maxLength={500} />
      </Field>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "שומרת…" : "שמירה"}
        </Button>
      </DialogFooter>
    </form>
  );
}
