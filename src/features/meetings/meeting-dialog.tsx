"use client";

import { useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { CheckIcon, ClockIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import { formatDate, isoToJerusalem } from "@/features/shared/format";
import { deleteMeeting, logMeetingAsWork, saveMeeting } from "./actions";
import { timeRange } from "./labels";
import type { MeetingItem, TaskOption } from "./queries";

export type ClientOption = { id: string; name: string };

export type MeetingDialogState =
  | { kind: "create"; date: string; start: string; end: string }
  // ended: הפגישה הסתיימה ברגע הפתיחה (נקבע ב-handler, לא ב-render)
  | { kind: "edit"; meeting: MeetingItem; ended: boolean }
  | null;

type Options = { clients: ClientOption[]; tasks: TaskOption[] };

export function MeetingDialog({
  state,
  onClose,
  ...options
}: Options & { state: MeetingDialogState; onClose: () => void }) {
  const [pane, setPane] = useState<"details" | "log">("details");
  const meeting = state?.kind === "edit" ? state.meeting : null;
  // כל סגירה (ביטול, שמירה, מחיקה, רישום) מחזירה את החלון לפרטי הפגישה
  const close = useCallback(() => {
    setPane("details");
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {state && pane === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>{meeting ? "עריכת פגישה" : "פגישה חדשה"}</DialogTitle>
              <DialogDescription>
                {meeting?.is_all_day ? "אירוע של יום שלם. התאריכים נערכים ב-Google." : "השעות לפי שעון ישראל."}
              </DialogDescription>
            </DialogHeader>
            <MeetingForm
              key={state.kind === "edit" ? state.meeting.id : `${state.date}-${state.start}`}
              state={state}
              onDone={close}
              onLogWork={() => setPane("log")}
              {...options}
            />
          </>
        )}
        {meeting && pane === "log" && (
          <>
            <DialogHeader>
              <DialogTitle>רישום כזמן עבודה</DialogTitle>
              <DialogDescription>
                {meeting.title} · {formatDate(meeting.starts_at)} {timeRange(meeting.starts_at, meeting.ends_at)}
              </DialogDescription>
            </DialogHeader>
            <LogWorkForm meeting={meeting} tasks={options.tasks} onBack={() => setPane("details")} onDone={close} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// משימות לבחירה: מסוננות לפי הלקוח, ומשימה שכבר משויכת נשארת ברשימה גם אם הושלמה
function useTaskChoices(tasks: TaskOption[], clientId: string, meeting: MeetingItem | null) {
  return useMemo(() => {
    const list = clientId ? tasks.filter((t) => t.client_id === clientId) : tasks;
    if (meeting?.task_id && meeting.tasks && !list.some((t) => t.id === meeting.task_id)) {
      const suffix = meeting.tasks.status === "done" ? " (הושלמה)" : "";
      return [{ id: meeting.task_id, title: meeting.tasks.title + suffix, client_id: meeting.client_id }, ...list];
    }
    return list;
  }, [tasks, clientId, meeting]);
}

function MeetingForm({
  state,
  clients,
  tasks,
  onDone,
  onLogWork,
}: Options & {
  state: NonNullable<MeetingDialogState>;
  onDone: () => void;
  onLogWork: () => void;
}) {
  const [result, action, pending] = useActionState<ActionState, FormData>(saveMeeting, {});
  const [deleting, startDelete] = useTransition();
  const meeting = state.kind === "edit" ? state.meeting : null;
  const fe = result.fieldErrors ?? {};
  const v = result.values;

  const start = meeting ? isoToJerusalem(meeting.starts_at) : null;
  const end = meeting ? isoToJerusalem(meeting.ends_at) : null;
  const initial = {
    date: start?.date ?? (state.kind === "create" ? state.date : ""),
    start: start?.time ?? (state.kind === "create" ? state.start : ""),
    end: end?.time ?? (state.kind === "create" ? state.end : ""),
  };

  const [clientId, setClientId] = useState(v?.client_id ?? meeting?.client_id ?? "");
  const [taskId, setTaskId] = useState(v?.task_id ?? meeting?.task_id ?? "");
  const taskChoices = useTaskChoices(tasks, clientId, meeting);
  // לקוח שהוחלף: משימה שלא שייכת לו מתאפסת
  const selectedTask = taskChoices.some((t) => t.id === taskId) ? taskId : "";

  // לקוח בארכיון שכבר משויך לפגישה נשאר בבחירה
  const clientChoices =
    meeting?.client_id && meeting.clients && !clients.some((c) => c.id === meeting.client_id)
      ? [{ id: meeting.client_id, name: meeting.clients.name }, ...clients]
      : clients;

  useEffect(() => {
    if (result.ok) {
      toast.success(meeting ? "הפגישה עודכנה" : "הפגישה נוספה");
      onDone();
    }
  }, [result, meeting, onDone]);

  const canLogWork =
    state.kind === "edit" && state.ended && !state.meeting.is_all_day && state.meeting.loggedCount === 0;

  return (
    <form action={action} className="grid gap-4">
      {meeting && <input type="hidden" name="id" value={meeting.id} />}
      <Field id="meeting-title" label="כותרת" error={fe.title} required>
        <Input name="title" defaultValue={v?.title ?? meeting?.title ?? ""} maxLength={200} required autoFocus />
      </Field>

      {!meeting?.is_all_day && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="meeting-date" label="תאריך" error={fe.date} required>
            <Input name="date" type="date" dir="ltr" defaultValue={v?.date ?? initial.date} required />
          </Field>
          <Field id="meeting-start" label="משעה" error={fe.start} required>
            <Input name="start" type="time" dir="ltr" defaultValue={v?.start ?? initial.start} required />
          </Field>
          <Field id="meeting-end" label="עד שעה" error={fe.end} required>
            <Input name="end" type="time" dir="ltr" defaultValue={v?.end ?? initial.end} required />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="meeting-client" label="לקוח" error={fe.client_id}>
          <NativeSelect name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">ללא לקוח</option>
            {clientChoices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="meeting-task" label="משימה קשורה" error={fe.task_id}>
          <NativeSelect name="task_id" value={selectedTask} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">ללא משימה</option>
            {taskChoices.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field id="meeting-location" label="מיקום או קישור" error={fe.location}>
        <Input name="location" defaultValue={v?.location ?? meeting?.location ?? ""} maxLength={500} />
      </Field>
      <Field id="meeting-notes" label="הערות" error={fe.notes}>
        <Textarea name="notes" rows={3} defaultValue={v?.notes ?? meeting?.notes ?? ""} maxLength={5000} />
      </Field>

      {result.error && (
        <p role="alert" className="text-destructive text-sm">
          {result.error}
        </p>
      )}

      <DialogFooter className="flex-wrap gap-2 sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {meeting && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive"
              disabled={deleting || pending}
              onClick={() => {
                if (!confirm(`למחוק את הפגישה "${meeting.title}"?`)) return;
                startDelete(async () => {
                  const res = await deleteMeeting(meeting.id);
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("הפגישה נמחקה");
                    onDone();
                  }
                });
              }}
            >
              <Trash2Icon />
              מחיקה
            </Button>
          )}
          {canLogWork && (
            <Button type="button" variant="outline" onClick={onLogWork} disabled={pending}>
              <ClockIcon />
              רשום כזמן עבודה
            </Button>
          )}
          {meeting && meeting.loggedCount > 0 && (
            <span className="text-muted-foreground flex items-center gap-1 text-sm">
              <CheckIcon className="size-4" aria-hidden />
              נרשם כזמן עבודה
            </span>
          )}
        </div>
        <Button type="submit" disabled={pending || deleting}>
          {pending ? "שומרת…" : "שמירה"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function LogWorkForm({
  meeting,
  tasks,
  onBack,
  onDone,
}: {
  meeting: MeetingItem;
  tasks: TaskOption[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [result, action, pending] = useActionState<ActionState, FormData>(logMeetingAsWork, {});
  const fe = result.fieldErrors ?? {};
  const v = result.values;
  // מסננים ללקוח של הפגישה, אלא אם אין לו משימות פתוחות
  const clientHasTasks = Boolean(meeting.client_id && tasks.some((t) => t.client_id === meeting.client_id));
  const taskChoices = useTaskChoices(tasks, clientHasTasks ? meeting.client_id! : "", meeting);
  const start = isoToJerusalem(meeting.starts_at);
  const end = isoToJerusalem(meeting.ends_at);

  useEffect(() => {
    if (result.ok) {
      toast.success("הזמן נרשם על המשימה");
      onDone();
    }
  }, [result, onDone]);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="meeting_id" value={meeting.id} />
      <Field id="log-task" label="משימה" error={fe.task_id} required>
        <NativeSelect name="task_id" defaultValue={v?.task_id ?? meeting.task_id ?? ""} required>
          <option value="">בחרי משימה</option>
          {taskChoices.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {clientHasTasks && (
        <p className="text-muted-foreground -mt-2 text-xs">מוצגות המשימות הפתוחות של הלקוח {meeting.clients?.name}.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="log-date" label="תאריך" error={fe.date} required>
          <Input name="date" type="date" dir="ltr" defaultValue={v?.date ?? start.date} required />
        </Field>
        <Field id="log-start" label="משעה" error={fe.start} required>
          <Input name="start" type="time" dir="ltr" defaultValue={v?.start ?? start.time} required />
        </Field>
        <Field id="log-end" label="עד שעה" error={fe.end} required>
          <Input
            name="end"
            type="time"
            dir="ltr"
            // פגישה שחוצה חצות: הרישום נעצר בסוף היום, כמו ברישום ידני
            defaultValue={v?.end ?? (end.date === start.date ? end.time : "23:59")}
            required
          />
        </Field>
      </div>
      <Field id="log-note" label="הערה" error={fe.note}>
        <Input name="note" defaultValue={v?.note ?? `פגישה: ${meeting.title}`} maxLength={500} />
      </Field>
      {result.error && (
        <p role="alert" className="text-destructive text-sm">
          {result.error}
        </p>
      )}
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          חזרה
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "רושמת…" : "רישום"}
        </Button>
      </DialogFooter>
    </form>
  );
}
