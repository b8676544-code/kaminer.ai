"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { STATUS_BADGE_CLASS, STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/features/shared/labels";
import { cn } from "@/lib/utils";
import { setTaskStatus } from "./actions";

// שינוי סטטוס בלחיצה, עם עדכון אופטימי
export function StatusSwitcher({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  return (
    <div role="radiogroup" aria-label="סטטוס" className="flex flex-wrap gap-1">
      {TASK_STATUSES.map((s) => {
        const active = optimistic === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() => {
              if (active) return;
              startTransition(async () => {
                setOptimistic(s);
                const res = await setTaskStatus(taskId, s);
                if (res.error) toast.error(res.error);
                else if (s === "done") toast.success("כל הכבוד! המשימה הושלמה");
              });
            }}
            className={cn(
              "rounded-md border px-3 py-1 text-sm transition-colors disabled:opacity-70",
              active ? STATUS_BADGE_CLASS[s] + " font-medium" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
