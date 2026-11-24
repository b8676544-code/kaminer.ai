"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { formatDate, isOverdue } from "@/features/shared/format";
import { setTaskStatus } from "@/features/tasks/actions";
import type { RunningTimer } from "@/features/time/queries";
import { TimerButton } from "@/features/time/timer-button";
import { cn } from "@/lib/utils";

export type TodayRowTask = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  due_date: string | null;
  clients: { name: string } | null;
};

// שורת משימה ב"היום שלי": סימון "הושלם", לקוח או "אישית", תאריך ו-▶
export function TodayTaskRow({
  task,
  today,
  serverRunning,
}: {
  task: TodayRowTask;
  today: string;
  serverRunning: RunningTimer | null;
}) {
  // סימון אופטימי: השורה מסומנת מיד, ונעלמת כשהעמוד מתרענן מהשרת
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const overdue = isOverdue(task.due_date, task.status, today);
  const personal = task.category === "personal";

  function complete() {
    const previous = task.status;
    setDone(true);
    startTransition(async () => {
      const res = await setTaskStatus(task.id, "done");
      if (res.error) {
        setDone(false);
        toast.error(res.error);
        return;
      }
      toast.success(`"${task.title}" הושלמה`, {
        // זמן לחרטה
        duration: 8000,
        action: {
          label: "ביטול",
          onClick: async () => {
            const undo = await setTaskStatus(task.id, previous);
            if (undo.error) toast.error(undo.error);
          },
        },
      });
    });
  }

  return (
    <li className={cn("flex items-center gap-2 py-2 text-sm", done && "opacity-50")}>
      {/* QA-8: אזור לחיצה גדול סביב התיבה, בלי לשנות את הפריסה */}
      <label className="-mx-3.5 -my-2.5 flex h-9 w-11 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          className="accent-primary size-4 shrink-0"
          checked={done}
          disabled={done || pending}
          onChange={complete}
          aria-label={`סימון "${task.title}" כהושלמה`}
        />
      </label>
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${task.id}`} className={cn("font-medium hover:underline", done && "line-through")}>
          {task.title}
        </Link>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
          {personal ? (
            <span className="rounded bg-amber-500/20 px-1.5 text-amber-900 dark:text-amber-200">אישית</span>
          ) : (
            task.clients && <span>{task.clients.name}</span>
          )}
          {task.priority === "urgent" && <span className="text-destructive font-medium">דחופה</span>}
          {task.due_date && (
            <span className={cn(overdue && "text-destructive font-medium")}>
              {formatDate(task.due_date)}
              {overdue && " (באיחור)"}
            </span>
          )}
        </div>
      </div>
      <TimerButton task={{ id: task.id, title: task.title, status: task.status }} serverRunning={serverRunning} compact />
    </li>
  );
}
