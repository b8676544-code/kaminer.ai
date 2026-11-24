"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SquareIcon, TimerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatElapsed } from "@/features/shared/format";
import { cn } from "@/lib/utils";
import type { RunningTimer } from "./queries";
import { FORGOTTEN_TIMER_HOURS } from "./schemas";
import { isForgotten, useTimer } from "./timer-provider";

// מתקתק כל שנייה. null עד ה-mount, כדי שהשרת והדפדפן ירנדרו אותו דבר
function useNow(active: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function HeaderTimer({ serverRunning }: { serverRunning: RunningTimer | null }) {
  const { running, requestStop, pending } = useTimer(serverRunning);
  const now = useNow(running !== null);

  if (!running) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm" aria-label="שעון">
        <TimerIcon className="size-4" aria-hidden />
        <span>אין שעון פעיל</span>
      </div>
    );
  }

  const elapsed = now === null ? null : (now - new Date(running.startedAt).getTime()) / 1000;
  const forgotten = now !== null && isForgotten(running.startedAt, now);

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-md border px-2 py-1 text-sm",
        forgotten ? "border-destructive/50 bg-destructive/10 text-destructive" : "bg-primary/5",
      )}
      aria-label="שעון פעיל"
    >
      <TimerIcon className="size-4 shrink-0 motion-safe:animate-pulse" aria-hidden />
      <Link
        href={running.id === "optimistic" ? "#" : `/tasks/${running.taskId}`}
        className="max-w-[16ch] truncate hover:underline sm:max-w-[28ch]"
        title={running.taskTitle}
      >
        {running.taskTitle}
      </Link>
      <span className="font-medium tabular-nums" dir="ltr" role="timer" aria-live="off">
        {elapsed === null ? "—" : formatElapsed(elapsed)}
      </span>
      {forgotten && <span className="sr-only">השעון רץ יותר מ-{FORGOTTEN_TIMER_HOURS} שעות</span>}
      <Button
        size="icon"
        variant="ghost"
        className="relative size-7 after:absolute after:-inset-2 after:content-['']" // QA-8: אזור לחיצה של 44px
        onClick={() => requestStop(running)}
        disabled={pending || running.id === "optimistic"}
        aria-label="עצירת השעון"
        title="עצירת השעון"
      >
        <SquareIcon className="fill-current" />
      </Button>
    </div>
  );
}
