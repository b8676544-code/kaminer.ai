"use client";

import Link from "next/link";
import { ListTodoIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { meetingsOnDay } from "./calendar-range";
import { calendarHref, timeOf, WEEKDAY_SHORT, meetingTone } from "./labels";
import type { MeetingItem } from "./queries";

const MAX_PER_DAY = 3;
const DEFAULT_START_MINUTES = 9 * 60;

export function MonthView({
  weeks,
  month,
  today,
  meetings,
  onCreate,
  onOpen,
}: {
  weeks: string[][];
  // "yyyy-mm" של החודש המוצג. ימים מחודש אחר מוצגים מעומעמים
  month: string;
  today: string;
  meetings: MeetingItem[];
  onCreate: (date: string, startMinutes: number) => void;
  onOpen: (meeting: MeetingItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[42rem]">
        <div className="bg-muted/50 grid grid-cols-7 border-b text-center text-sm font-medium">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="border-s py-2 first:border-s-0">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((d) => {
              const list = meetingsOnDay(meetings, d);
              const extra = list.length - MAX_PER_DAY;
              return (
                <div
                  key={d}
                  data-testid={`day-${d}`}
                  className={cn(
                    "min-h-28 cursor-pointer border-s p-1 first:border-s-0",
                    d.slice(0, 7) !== month && "bg-muted/30 text-muted-foreground",
                  )}
                  onClick={() => onCreate(d, DEFAULT_START_MINUTES)}
                >
                  <div className="mb-1 flex">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-xs",
                        d === today && "bg-primary text-primary-foreground font-bold",
                      )}
                    >
                      {Number(d.slice(8, 10))}
                    </span>
                  </div>
                  <div className="grid gap-0.5">
                    {list.slice(0, MAX_PER_DAY).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(m);
                        }}
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1 py-0.5 text-start text-xs",
                          m.is_all_day || m.is_personal ? meetingTone(m).chip : "hover:bg-muted",
                        )}
                      >
                        {!m.is_all_day && (
                          <span className="text-muted-foreground shrink-0 tabular-nums" dir="ltr">
                            {timeOf(m.starts_at)}
                          </span>
                        )}
                        {m.from_task && <ListTodoIcon className="size-3 shrink-0" aria-label="משימה" />}
                        <span className="truncate">{m.title}</span>
                      </button>
                    ))}
                    {extra > 0 && (
                      <Link
                        href={calendarHref("week", d)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground px-1 text-xs hover:underline"
                      >
                        עוד {extra}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
