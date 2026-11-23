"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { isoToJerusalem } from "@/features/shared/format";
import { layoutDay, meetingsOnDay } from "./calendar-range";
import { dayMonth, timeRange, weekdayLabel } from "./labels";
import type { MeetingItem } from "./queries";

const HOUR_PX = 48;
const SLOT_MINUTES = 30;
const SCROLL_TO_HOUR = 7;

// השעה הנוכחית בשעון ירושלים. מחושב רק בדפדפן כדי לא ליצור הבדל בין שרת ללקוח
function useNow() {
  const [now, setNow] = useState<{ date: string; minutes: number; iso: string } | null>(null);
  useEffect(() => {
    const tick = () => {
      const iso = new Date().toISOString();
      const { date, time } = isoToJerusalem(iso);
      setNow({ date, minutes: Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)), iso });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function WeekView({
  days,
  today,
  meetings,
  onCreate,
  onOpen,
}: {
  days: string[];
  today: string;
  meetings: MeetingItem[];
  onCreate: (date: string, startMinutes: number) => void;
  onOpen: (meeting: MeetingItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: SCROLL_TO_HOUR * HOUR_PX });
  }, []);

  const allDayByDay = days.map((d) => meetingsOnDay(meetings, d).filter((m) => m.is_all_day));
  const hasAllDay = allDayByDay.some((list) => list.length > 0);
  const columns = "grid-cols-[3.25rem_repeat(7,minmax(6.5rem,1fr))]";

  return (
    <div ref={scrollRef} className="max-h-[72vh] overflow-auto rounded-lg border">
      <div className="min-w-[48rem]">
        {/* כותרות הימים ואירועי יום שלם */}
        <div className={cn("bg-background sticky top-0 z-20 grid border-b", columns)}>
          <div />
          {days.map((d, i) => (
            <div key={d} className="border-s px-1 py-2 text-center">
              <div className={cn("text-sm", d === today && "text-primary font-bold")}>
                <span className="text-muted-foreground me-1">{weekdayLabel(d)}</span>
                <span
                  className={cn(
                    "inline-flex min-w-8 justify-center rounded-full px-1",
                    d === today && "bg-primary text-primary-foreground",
                  )}
                >
                  {dayMonth(d)}
                </span>
              </div>
              {hasAllDay && (
                <div className="mt-1 grid gap-1">
                  {allDayByDay[i].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onOpen(m)}
                      className="bg-primary/15 hover:bg-primary/25 truncate rounded px-1.5 py-0.5 text-start text-xs"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* גריד השעות */}
        <div className={cn("grid", columns)}>
          <div className="relative" style={{ height: 24 * HOUR_PX }}>
            {Array.from({ length: 23 }, (_, i) => (
              <span
                key={i}
                className="text-muted-foreground absolute end-1.5 -translate-y-1/2 text-[11px] tabular-nums"
                style={{ top: (i + 1) * HOUR_PX }}
                dir="ltr"
              >
                {String(i + 1).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d}
              data-testid={`day-${d}`}
              className={cn("relative cursor-pointer border-s", d === today && "bg-primary/[0.03]")}
              style={{ height: 24 * HOUR_PX }}
              onClick={(e) => {
                // לחיצה על משבצת ריקה: פגישה חדשה בחצי השעה שנלחצה
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                const slot = Math.floor(y / (HOUR_PX / 2));
                onCreate(d, Math.min(slot * SLOT_MINUTES, 24 * 60 - SLOT_MINUTES));
              }}
            >
              {Array.from({ length: 48 }, (_, i) => (
                <div
                  key={i}
                  className={cn("border-b", i % 2 === 0 ? "border-border/40 border-dashed" : "border-border")}
                  style={{ height: HOUR_PX / 2 }}
                />
              ))}

              {now?.date === d && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                  style={{ top: (now.minutes / 60) * HOUR_PX }}
                >
                  <span className="absolute -top-[5px] -start-[5px] size-2 rounded-full bg-red-500" />
                </div>
              )}

              {layoutDay(meetings, d).map(({ meeting: m, startMin, endMin, column, columns: cols }) => {
                const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 18);
                const past = now !== null && new Date(m.ends_at).getTime() < new Date(now.iso).getTime();
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`${m.title}, ${timeRange(m.starts_at, m.ends_at)}${m.clients ? `, ${m.clients.name}` : ""}${m.loggedCount > 0 ? ", נרשם כזמן עבודה" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(m);
                    }}
                    className={cn(
                      "bg-primary/10 hover:bg-primary/20 border-primary absolute z-[5] overflow-hidden rounded-md border-s-[3px] px-1.5 py-0.5 text-start text-xs leading-tight",
                      past && "opacity-60",
                    )}
                    style={{
                      top: (startMin / 60) * HOUR_PX + 1,
                      height: height - 2,
                      insetInlineStart: `calc(${(column / cols) * 100}% + 2px)`,
                      width: `calc(${100 / cols}% - 4px)`,
                    }}
                  >
                    <span className="flex items-center gap-1 font-medium">
                      <span className="truncate">{m.title}</span>
                      {m.loggedCount > 0 && <CheckIcon className="size-3 shrink-0" aria-label="נרשם כזמן עבודה" />}
                    </span>
                    {height > 30 && (
                      <span className="text-muted-foreground block truncate" dir="ltr">
                        {timeRange(m.starts_at, m.ends_at)}
                      </span>
                    )}
                    {height > 46 && m.clients && (
                      <span className="text-muted-foreground block truncate">{m.clients.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
