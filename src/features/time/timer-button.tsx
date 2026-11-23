"use client";

import { PlayIcon, SquareIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RunningTimer } from "./queries";
import { useTimer } from "./timer-provider";

// ▶/⏹ למשימה. compact: אייקון בלבד, לשורות ברשימה
export function TimerButton({
  task,
  serverRunning,
  compact = false,
}: {
  task: { id: string; title: string; status: string };
  serverRunning: RunningTimer | null;
  compact?: boolean;
}) {
  const { running, start, requestStop, pending } = useTimer(serverRunning);
  const isThis = running?.taskId === task.id;
  const done = task.status === "done";
  const label = isThis ? "עצירת השעון" : done ? "המשימה הושלמה" : "הפעלת שעון";

  function onClick() {
    if (isThis && running) requestStop(running);
    else start({ id: task.id, title: task.title });
  }

  const Icon = isThis ? SquareIcon : PlayIcon;
  return (
    <Button
      type="button"
      size={compact ? "icon" : "sm"}
      variant={isThis ? "default" : "outline"}
      className={compact ? "size-8" : undefined}
      onClick={onClick}
      disabled={pending || (done && !isThis) || running?.id === "optimistic"}
      aria-label={compact ? `${label}: ${task.title}` : undefined}
      title={label}
    >
      <Icon className="fill-current" />
      {!compact && (isThis ? "עצירה" : "הפעלת שעון")}
    </Button>
  );
}
