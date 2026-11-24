import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { meetingsOnDay } from "@/features/meetings/calendar-range";
import { calendarHref, dayMonth, timeRange, weekdayLabel } from "@/features/meetings/labels";
import type { MeetingItem } from "@/features/meetings/queries";
import { formatDate, formatMinutes } from "@/features/shared/format";
import { HeaderTimer } from "@/features/time/header-timer";
import { getRunningTimer, type RunningTimer } from "@/features/time/queries";
import { getTodayData, type TodayData, type TodayTask } from "@/features/today/queries";
import { TodayTaskRow } from "@/features/today/today-task-row";
import { cn } from "@/lib/utils";

export const metadata = { title: "היום שלי — kaminer.ai" };

export default function TodayPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
      <Today />
    </Suspense>
  );
}

async function Today() {
  const [data, running] = await Promise.all([getTodayData(), getRunningTimer()]);
  const { today, tomorrow, nowIso, tasks, meetings, minutes } = data;
  const work = tasks.business;
  const todayMeetings = meetingsOnDay(meetings, today);
  const tomorrowMeetings = meetingsOnDay(meetings, tomorrow);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">היום שלי</h1>
        <span className="text-muted-foreground">
          יום {weekdayLabel(today)}, {formatDate(today)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-muted-foreground text-sm font-medium">עכשיו</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <HeaderTimer serverRunning={running} />
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-muted-foreground text-sm font-medium">שעות היום</CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-3 px-4">
            <span className="text-2xl font-bold tabular-nums">{formatMinutes(minutes.total)}</span>
            <span className="text-muted-foreground text-sm">מתוכן לחיוב {formatMinutes(minutes.billable)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <TaskCard
            title="לביצוע היום"
            tasks={work.dueToday}
            today={today}
            running={running}
            empty="אין משימות להיום 🎉"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/tasks/new">
                  <PlusIcon />
                  משימה חדשה
                </Link>
              </Button>
            }
          />
          <TaskCard
            title="בתהליך"
            tasks={work.inProgress}
            today={today}
            running={running}
            empty="אין משימות נוספות בתהליך."
          />
          <TaskCard
            title="ממתינות ללקוח"
            tasks={work.waiting}
            today={today}
            running={running}
            empty="אין משימות שממתינות ללקוח."
          />
          <TaskCard
            title="ללא תאריך"
            tasks={work.undated}
            today={today}
            running={running}
            empty="אין משימות פתוחות בלי תאריך יעד."
          />
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">פגישות היום ({todayMeetings.length})</CardTitle>
              <Link href={calendarHref("week", today)} className="text-muted-foreground text-sm hover:underline">
                ליומן
              </Link>
            </CardHeader>
            <CardContent>
              <MeetingList meetings={todayMeetings} today={today} nowIso={nowIso} empty="אין פגישות היום." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">השבוע הקרוב</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {work.week.length === 0 ? (
                <p className="text-muted-foreground text-sm">אין משימות עם תאריך יעד בשבוע הקרוב.</p>
              ) : (
                work.week.map(({ day, tasks: dayTasks }) => (
                  <div key={day}>
                    <h3 className="text-muted-foreground text-sm font-medium">
                      {day === tomorrow ? "מחר" : `יום ${weekdayLabel(day)}`} · {dayMonth(day)}
                    </h3>
                    <ul className="divide-y">
                      {dayTasks.map((t) => (
                        <TodayTaskRow key={t.id} task={t} today={today} serverRunning={running} />
                      ))}
                    </ul>
                  </div>
                ))
              )}
              <div className="border-t pt-3">
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">פגישות מחר</h3>
                <MeetingList meetings={tomorrowMeetings} today={tomorrow} nowIso={nowIso} empty="אין פגישות מחר." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PersonalCard groups={tasks.personal} today={today} tomorrow={tomorrow} running={running} />
    </div>
  );
}

// משימות אישיות: כרטיס אחד בתחתית, מודגש בענבר, עם אותה חלוקה כמו העסקיות
function PersonalCard({
  groups,
  today,
  tomorrow,
  running,
}: {
  groups: TodayData["tasks"]["personal"];
  today: string;
  tomorrow: string;
  running: RunningTimer | null;
}) {
  const sections: { title: string; tasks: TodayTask[] }[] = [
    { title: "להיום ובאיחור", tasks: groups.dueToday },
    { title: "בתהליך", tasks: groups.inProgress },
    { title: "ממתינות", tasks: groups.waiting },
    ...groups.week.map(({ day, tasks }) => ({
      title: `${day === tomorrow ? "מחר" : `יום ${weekdayLabel(day)}`} · ${dayMonth(day)}`,
      tasks,
    })),
    { title: "ללא תאריך", tasks: groups.undated },
  ].filter((s) => s.tasks.length > 0);
  const total = sections.reduce((n, s) => n + s.tasks.length, 0);

  return (
    <Card className="border-s-4 border-amber-400 bg-amber-50/70 dark:border-amber-500/70 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="text-base text-amber-900 dark:text-amber-200">אישיות ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground text-sm">אין משימות אישיות פתוחות.</p>
        ) : (
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {sections.map((s) => (
              <div key={s.title}>
                <h3 className="text-sm font-medium text-amber-900/80 dark:text-amber-200/80">{s.title}</h3>
                <ul className="divide-y divide-amber-200/70 dark:divide-amber-800/40">
                  {s.tasks.map((t) => (
                    <TodayTaskRow key={t.id} task={t} today={today} serverRunning={running} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskCard({
  title,
  tasks,
  today,
  running,
  empty,
  action,
}: {
  title: string;
  tasks: TodayTask[];
  today: string;
  running: RunningTimer | null;
  empty: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {title} ({tasks.length})
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <ul className="divide-y">
            {tasks.map((t) => (
              <TodayTaskRow key={t.id} task={t} today={today} serverRunning={running} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingList({
  meetings,
  today,
  nowIso,
  empty,
}: {
  meetings: MeetingItem[];
  today: string;
  nowIso: string;
  empty: string;
}) {
  if (meetings.length === 0) return <p className="text-muted-foreground text-sm">{empty}</p>;
  return (
    <ul className="grid gap-1.5">
      {meetings.map((m) => (
        <li key={m.id}>
          <Link
            href={calendarHref("week", today)}
            className={cn(
              "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:underline",
              m.is_personal ? "bg-amber-500/15" : "bg-muted/60",
              m.ends_at < nowIso && "opacity-60",
            )}
          >
            <span className="text-muted-foreground shrink-0 tabular-nums" dir="ltr">
              {m.is_all_day ? "יום שלם" : timeRange(m.starts_at, m.ends_at)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{m.title}</span>
              {m.is_personal ? (
                <span className="text-xs text-amber-900 dark:text-amber-200">אישית</span>
              ) : (
                m.clients && <span className="text-muted-foreground block truncate text-xs">{m.clients.name}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
