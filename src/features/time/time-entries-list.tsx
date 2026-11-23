"use client";

import { useTransition } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDate, formatMinutes, isoToJerusalem } from "@/features/shared/format";
import { deleteTimeEntry } from "./actions";
import { TimeEntryFormDialog } from "./time-entry-form-dialog";

export type TimeEntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_manual: boolean;
  note: string | null;
};

export function TimeEntriesList({ taskId, entries }: { taskId: string; entries: TimeEntryRow[] }) {
  return (
    <div className="grid gap-2">
      {entries.length > 0 ? (
        <ul className="divide-y text-sm">
          {entries.map((e) => (
            <EntryRow key={e.id} taskId={taskId} entry={e} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">עוד לא נרשם זמן.</p>
      )}
      <TimeEntryFormDialog
        taskId={taskId}
        trigger={
          <Button variant="outline" size="sm" className="w-fit">
            <PlusIcon />
            הוספת זמן ידנית
          </Button>
        }
      />
    </div>
  );
}

function EntryRow({ taskId, entry }: { taskId: string; entry: TimeEntryRow }) {
  const [pending, startTransition] = useTransition();
  const start = isoToJerusalem(entry.started_at).time;
  const end = entry.ended_at ? isoToJerusalem(entry.ended_at).time : null;

  return (
    <li className="flex items-center gap-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p>
          {formatDate(entry.started_at)}{" "}
          <span className="text-muted-foreground whitespace-nowrap tabular-nums" dir="ltr">
            {start}–{end ?? "…"}
          </span>
          {entry.is_manual && <span className="text-muted-foreground"> · ידני</span>}
        </p>
        {entry.note && <p className="text-muted-foreground truncate text-xs">{entry.note}</p>}
      </div>
      <span className="font-medium tabular-nums">{entry.ended_at ? formatMinutes(entry.duration_minutes) : "רץ…"}</span>
      {entry.ended_at && (
        <>
          <TimeEntryFormDialog
            taskId={taskId}
            entry={{ id: entry.id, started_at: entry.started_at, ended_at: entry.ended_at, note: entry.note }}
            trigger={
              <Button variant="ghost" size="icon" className="size-7" aria-label="עריכת הרישום" title="עריכה">
                <PencilIcon />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive size-7"
            aria-label="מחיקת הרישום"
            title="מחיקה"
            disabled={pending}
            onClick={() => {
              if (!confirm("למחוק את רישום הזמן? אי אפשר לבטל.")) return;
              startTransition(async () => {
                const res = await deleteTimeEntry(entry.id);
                if (res.error) toast.error(res.error);
                else toast.success("הרישום נמחק");
              });
            }}
          >
            <Trash2Icon />
          </Button>
        </>
      )}
    </li>
  );
}
