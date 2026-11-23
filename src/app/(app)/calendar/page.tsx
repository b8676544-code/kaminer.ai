import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CalendarDaysIcon, CalendarRangeIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { listActiveClientOptions } from "@/features/clients/queries";
import { SyncErrorBanner } from "@/features/google/google-settings-card";
import { getGoogleConnection } from "@/features/google/queries";
import { SyncNowButton } from "@/features/google/sync-now-button";
import { CalendarBoard } from "@/features/meetings/calendar-board";
import { calendarRange, monthGrid, shiftDate, weekDays, type CalendarView } from "@/features/meetings/calendar-range";
import { calendarHref, rangeTitle } from "@/features/meetings/labels";
import { listInviteContacts, listMeetings, listOpenTaskOptions } from "@/features/meetings/queries";
import { todayInJerusalem } from "@/features/shared/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "יומן — kaminer.ai" };

const paramsSchema = z.object({
  view: z.enum(["week", "month"]).catch("week"),
  date: z.iso.date().optional().catch(undefined),
});

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">יומן</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען יומן…</p>}>
        <CalendarContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CalendarContent({ searchParams }: Pick<PageProps<"/calendar">, "searchParams">) {
  const raw = await searchParams;
  const params = paramsSchema.parse({ view: raw.view, date: raw.date });
  // "היום" תלוי בשעת הבקשה, ולכן מחשבים אותו בזמן הבקשה ולא ב-prerender
  await connection();
  const today = todayInJerusalem();
  const view: CalendarView = params.view;
  const date = params.date ?? today;
  const { from, to } = calendarRange(view, date);

  const [meetings, clients, tasks, google, contacts] = await Promise.all([
    listMeetings(from, to),
    listActiveClientOptions(),
    listOpenTaskOptions(),
    getGoogleConnection(),
    listInviteContacts(),
  ]);
  const googleActive = Boolean(google?.calendar_selected_at);
  const days = view === "week" ? weekDays(date) : monthGrid(date).flat();

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-label={view === "week" ? "השבוע הקודם" : "החודש הקודם"}>
            <Link href={calendarHref(view, shiftDate(view, date, -1))}>
              <ChevronRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={calendarHref(view, today)}>היום</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label={view === "week" ? "השבוע הבא" : "החודש הבא"}>
            <Link href={calendarHref(view, shiftDate(view, date, 1))}>
              <ChevronLeftIcon />
            </Link>
          </Button>
        </div>
        <h2 className="text-lg font-semibold" aria-live="polite">
          {rangeTitle(view, days)}
        </h2>
        <nav aria-label="תצוגה" className="bg-muted ms-auto inline-flex rounded-lg p-1 text-sm">
          {(
            [
              ["week", "שבוע", CalendarRangeIcon],
              ["month", "חודש", CalendarDaysIcon],
            ] as const
          ).map(([v, label, Icon]) => (
            <Link
              key={v}
              href={calendarHref(v, date)}
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1",
                view === v ? "bg-background font-medium shadow-sm" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        {googleActive && <SyncNowButton />}
      </div>

      {google?.last_sync_error && <SyncErrorBanner error={google.last_sync_error} />}

      <CalendarBoard view={view} date={date} today={today} meetings={meetings}
        clients={clients}
        tasks={tasks}
        contacts={contacts}
      />
    </div>
  );
}
