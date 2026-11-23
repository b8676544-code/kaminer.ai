"use client";

import { useCallback, useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { monthGrid, weekDays, type CalendarView } from "./calendar-range";
import { minutesToTime } from "./labels";
import { MeetingDialog, type ClientOption, type MeetingDialogState } from "./meeting-dialog";
import { MonthView } from "./month-view";
import type { MeetingItem, TaskOption } from "./queries";
import { DEFAULT_MEETING_MINUTES } from "./schemas";
import { WeekView } from "./week-view";

export function CalendarBoard({
  view,
  date,
  today,
  meetings,
  clients,
  tasks,
}: {
  view: CalendarView;
  date: string;
  today: string;
  meetings: MeetingItem[];
  clients: ClientOption[];
  tasks: TaskOption[];
}) {
  const [dialog, setDialog] = useState<MeetingDialogState>(null);
  const close = useCallback(() => setDialog(null), []);

  const create = (day: string, startMinutes: number) =>
    setDialog({
      kind: "create",
      date: day,
      start: minutesToTime(startMinutes),
      end: minutesToTime(startMinutes + DEFAULT_MEETING_MINUTES),
    });
  const open = (meeting: MeetingItem) =>
    setDialog({ kind: "edit", meeting, ended: new Date(meeting.ends_at).getTime() <= Date.now() });

  return (
    <div className="grid gap-3">
      <div className="flex">
        <Button size="sm" className="ms-auto" onClick={() => create(date, 9 * 60)}>
          <PlusIcon />
          פגישה חדשה
        </Button>
      </div>

      {view === "week" ? (
        <WeekView days={weekDays(date)} today={today} meetings={meetings} onCreate={create} onOpen={open} />
      ) : (
        <MonthView
          weeks={monthGrid(date)}
          month={date.slice(0, 7)}
          today={today}
          meetings={meetings}
          onCreate={create}
          onOpen={open}
        />
      )}

      <MeetingDialog state={dialog} onClose={close} clients={clients} tasks={tasks} />
    </div>
  );
}
