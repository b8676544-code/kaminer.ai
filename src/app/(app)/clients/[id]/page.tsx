import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchiveButton } from "@/features/clients/archive-button";
import { ClientFormDialog } from "@/features/clients/client-form-dialog";
import { getClientDetails } from "@/features/clients/queries";
import { calendarHref, timeRange } from "@/features/meetings/labels";
import { listClientMeetings, type ClientMeeting } from "@/features/meetings/queries";
import { formatDate, formatMinutes, formatMonth, isoToJerusalem } from "@/features/shared/format";
import { PriorityBadge, StatusBadge } from "@/features/tasks/badges";

export const metadata = { title: "לקוח — kaminer.ai" };

export default function ClientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
      <ClientDetails params={params} />
    </Suspense>
  );
}

async function ClientDetails({ params }: Pick<PageProps<"/clients/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [details, meetings] = await Promise.all([getClientDetails(id), listClientMeetings(id)]);
  if (!details) notFound();
  const { client, openTasks, doneTasks, monthlyHours } = details;

  return (
    <div className="grid gap-6">
      <Link href="/clients" className="text-muted-foreground flex w-fit items-center gap-1 text-sm hover:underline">
        <ChevronRightIcon className="size-4" aria-hidden />
        כל הלקוחות
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        {client.status === "archived" && <Badge variant="secondary">בארכיון</Badge>}
        <div className="ms-auto flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/tasks/new?client=${client.id}`}>
              <PlusIcon />
              משימה ללקוח
            </Link>
          </Button>
          <ClientFormDialog
            client={client}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon />
                עריכה
              </Button>
            }
          />
          <ArchiveButton id={client.id} status={client.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטי קשר</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">איש קשר</dt>
              <dd>{client.contact_name ?? "—"}</dd>
              <dt className="text-muted-foreground">טלפון</dt>
              <dd dir="ltr" className="text-end">
                {client.phone ? <a href={`tel:${client.phone}`}>{client.phone}</a> : "—"}
              </dd>
              <dt className="text-muted-foreground">מייל</dt>
              <dd dir="ltr" className="text-end">
                {client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : "—"}
              </dd>
              <dt className="text-muted-foreground">תעריף</dt>
              <dd>{client.hourly_rate != null ? `₪${client.hourly_rate} לשעה` : "—"}</dd>
            </dl>
            {client.notes && <p className="text-muted-foreground mt-4 text-sm whitespace-pre-line">{client.notes}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">משימות פתוחות ({openTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={openTasks} empty="אין משימות פתוחות ללקוח." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">שעות לפי חודש</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyHours.length === 0 ? (
              <p className="text-muted-foreground text-sm">עוד לא נרשם זמן.</p>
            ) : (
              <ul className="grid gap-1 text-sm">
                {monthlyHours.map((h) => (
                  <li key={h.month} className="flex justify-between">
                    <span>{h.month ? formatMonth(h.month) : "—"}</span>
                    <span className="font-medium">{formatMinutes(h.total_minutes)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">הושלמו ({doneTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={doneTasks} empty="עוד אין משימות שהושלמו." />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">פגישות</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <MeetingList title="קרובות" meetings={meetings.upcoming} empty="אין פגישות קרובות." />
            <MeetingList title="אחרונות" meetings={meetings.past} empty="עוד לא היו פגישות." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type TaskRow = Awaited<ReturnType<typeof getClientDetails>> extends infer D
  ? D extends { openTasks: (infer T)[] }
    ? T
    : never
  : never;

function MeetingList({ title, meetings, empty }: { title: string; meetings: ClientMeeting[]; empty: string }) {
  return (
    <div>
      <h3 className="text-muted-foreground mb-1 text-sm font-medium">{title}</h3>
      {meetings.length === 0 ? (
        <p className="text-muted-foreground text-sm">{empty}</p>
      ) : (
        <ul className="divide-y">
          {meetings.map((m) => (
            <li key={m.id} className="py-2 text-sm">
              <Link
                href={calendarHref("week", isoToJerusalem(m.starts_at).date)}
                className="flex flex-wrap gap-2 hover:underline"
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-muted-foreground ms-auto tabular-nums">
                  {formatDate(m.starts_at)}
                  {!m.is_all_day && <span dir="ltr"> {timeRange(m.starts_at, m.ends_at)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskList({ tasks, empty }: { tasks: TaskRow[]; empty: string }) {
  if (tasks.length === 0) return <p className="text-muted-foreground text-sm">{empty}</p>;
  return (
    <ul className="divide-y">
      {tasks.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
          <Link href={`/tasks/${t.id}`} className="font-medium hover:underline">
            {t.title}
          </Link>
          <PriorityBadge priority={t.priority} />
          <span className="text-muted-foreground ms-auto">{formatDate(t.due_date)}</span>
          <StatusBadge status={t.status} />
        </li>
      ))}
    </ul>
  );
}
