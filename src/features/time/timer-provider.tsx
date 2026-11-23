"use client";

import { createContext, useContext, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/shared/field";
import { formatDate, isoToJerusalem } from "@/features/shared/format";
import { startTimer, stopTimer } from "./actions";
import type { RunningTimer } from "./queries";
import { FORGOTTEN_TIMER_HOURS } from "./schemas";

// undefined = אין עדכון אופטימי, מציגים את מה שהשרת החזיר
type OptimisticTimer = RunningTimer | null | undefined;

type TimerContextValue = {
  optimistic: OptimisticTimer;
  pending: boolean;
  start: (task: { id: string; title: string }) => void;
  requestStop: (running: RunningTimer) => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function isForgotten(startedAt: string, now: number = Date.now()): boolean {
  return now - new Date(startedAt).getTime() > FORGOTTEN_TIMER_HOURS * 3600_000;
}

// מצב משותף לשעון בכותרת ולכפתורי ▶/⏹ בעמודים. השרת הוא מקור האמת;
// useOptimistic מציג את השינוי מיד, וחוזר לנתוני השרת כשהפעולה מסתיימת.
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [optimistic, setOptimistic] = useOptimistic<OptimisticTimer, OptimisticTimer>(undefined, (_, next) => next);
  const [pending, startTransition] = useTransition();
  const [forgotten, setForgotten] = useState<RunningTimer | null>(null);

  function start(task: { id: string; title: string }) {
    startTransition(async () => {
      setOptimistic({ id: "optimistic", taskId: task.id, taskTitle: task.title, startedAt: new Date().toISOString() });
      const res = await startTimer(task.id);
      if (res.error) toast.error(res.error);
    });
  }

  function stop(stopAt?: { date: string; time: string }) {
    startTransition(async () => {
      setOptimistic(null);
      const res = await stopTimer(stopAt);
      if (res.error) toast.error(res.error);
      else if (res.id) toast.success("הזמן נשמר");
      else toast.info("פחות מדקה, הרישום לא נשמר");
    });
  }

  function requestStop(running: RunningTimer) {
    if (isForgotten(running.startedAt)) setForgotten(running);
    else stop();
  }

  return (
    <TimerContext.Provider value={{ optimistic, pending, start, requestStop }}>
      {children}
      <ForgottenTimerDialog
        running={forgotten}
        onClose={() => setForgotten(null)}
        onStop={(stopAt) => {
          setForgotten(null);
          stop(stopAt);
        }}
      />
    </TimerContext.Provider>
  );
}

// השעון המוצג: עדכון אופטימי אם יש, אחרת נתוני השרת שהעמוד קיבל
export function useTimer(serverRunning: RunningTimer | null) {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside <TimerProvider>");
  const running = ctx.optimistic !== undefined ? ctx.optimistic : serverRunning;
  return { ...ctx, running };
}

// שעון שרץ מעל 8 שעות: מאפשרים לתקן את שעת הסיום לפני השמירה
function ForgottenTimerDialog({
  running,
  onClose,
  onStop,
}: {
  running: RunningTimer | null;
  onClose: () => void;
  onStop: (stopAt?: { date: string; time: string }) => void;
}) {
  return (
    <Dialog open={running !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>השעון רץ יותר מ-{FORGOTTEN_TIMER_HOURS} שעות</DialogTitle>
          <DialogDescription>
            {running && (
              <>
                השעון על &quot;{running.taskTitle}&quot; הופעל ב-{formatDate(running.startedAt)} בשעה{" "}
                {isoToJerusalem(running.startedAt).time}. מתי סיימת לעבוד?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {running && <ForgottenTimerForm startedAt={running.startedAt} onStop={onStop} />}
      </DialogContent>
    </Dialog>
  );
}

// מרונדר רק כשהחלון פתוח, ולכן "עכשיו" מחושב בזמן הפתיחה ולא ב-prerender
function ForgottenTimerForm({
  startedAt,
  onStop,
}: {
  startedAt: string;
  onStop: (stopAt?: { date: string; time: string }) => void;
}) {
  const [now] = useState(() => isoToJerusalem(new Date().toISOString()));
  const started = isoToJerusalem(startedAt);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onStop({ date: String(fd.get("date")), time: String(fd.get("time")) });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="stop-date" label="תאריך סיום" required>
          <Input name="date" type="date" dir="ltr" defaultValue={now.date} min={started.date} max={now.date} required />
        </Field>
        <Field id="stop-time" label="שעת סיום" required>
          <Input name="time" type="time" dir="ltr" defaultValue={now.time} required />
        </Field>
      </div>
      <DialogFooter className="gap-2">
        <Button type="submit">שמירה בשעה שבחרתי</Button>
        <Button type="button" variant="outline" onClick={() => onStop()}>
          שמירה עד עכשיו
        </Button>
      </DialogFooter>
    </form>
  );
}
