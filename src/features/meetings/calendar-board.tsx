"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { monthGrid, weekDays, type CalendarView } from "./calendar-range";
import { cn } from "@/lib/utils";
import { minutesToTime } from "./labels";
import { MeetingDialog, type ClientOption, type MeetingDialogState } from "./meeting-dialog";
import { MonthView } from "./month-view";
import type { InviteContact, MeetingItem, TaskOption } from "./queries";
import { DEFAULT_MEETING_MINUTES } from "./schemas";
import { WeekView } from "./week-view";

type MeetingFilter = "all" | "business" | "personal";
const FILTERS: { value: MeetingFilter; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "business", label: "עסקי" },
  { value: "personal", label: "אישי" },
];

export function CalendarBoard({
  view,
  date,
  today,
  meetings,
  clients,
  tasks,
  contacts,
}: {
  view: CalendarView;
  date: string;
  today: string;
  meetings: MeetingItem[];
  clients: ClientOption[];
  tasks: TaskOption[];
  contacts: InviteContact[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<MeetingDialogState>(null);
  const close = useCallback(() => setDialog(null), []);
  // נשמר במעבר בין שבועות (ניווט רך לא מאפס את הרכיב)
  const [filter, setFilter] = useState<MeetingFilter>("all");
  const shown = filter === "all" ? meetings : meetings.filter((m) => m.is_personal === (filter === "personal"));

  const create = (day: string, startMinutes: number) =>
    setDialog({
      kind: "create",
      date: day,
      start: minutesToTime(startMinutes),
      end: minutesToTime(startMinutes + DEFAULT_MEETING_MINUTES),
    });
  // זמן שנקבע למשימה נערך בדף המשימה (התאריך, השעה והמשך באים ממנה)
  const open = (meeting: MeetingItem) =>
    meeting.from_task && meeting.task_id
      ? router.push(`/tasks/${meeting.task_id}`)
      : setDialog({
      kind: "edit",
      meeting,
      ended: new Date(meeting.ends_at).getTime() <= Date.now(),
    });

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="סינון פגישות" className="bg-muted flex gap-1 rounded-md p-1 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1",
                filter === f.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground",
              )}
            >
              {f.value !== "all" && (
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", f.value === "personal" ? "bg-amber-500" : "bg-primary")}
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="ms-auto" onClick={() => create(date, 9 * 60)}>
          <PlusIcon />
          פגישה חדשה
        </Button>
      </div>

      {view === "week" ? (
        <WeekView days={weekDays(date)} today={today} meetings={shown} onCreate={create} onOpen={open} />
      ) : (
        <MonthView
          weeks={monthGrid(date)}
          month={date.slice(0, 7)}
          today={today}
          meetings={shown}
          onCreate={create}
          onOpen={open}
        />
      )}

      <MeetingDialog state={dialog} onClose={close} clients={clients} tasks={tasks} contacts={contacts} />
    </div>
  );
}
