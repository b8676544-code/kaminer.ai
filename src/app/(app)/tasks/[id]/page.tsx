import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, CopyPlusIcon, PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { taskBillableMinutes } from "@/features/projects/queries";
import { PricingCard } from "@/features/shared/pricing-card";
import { formatDate, formatMinutes, isOverdue, todayInJerusalem } from "@/features/shared/format";
import { CategoryBadge, PriorityBadge } from "@/features/tasks/badges";
import { Checklist } from "@/features/tasks/checklist";
import { DeleteTaskButton } from "@/features/tasks/delete-task-button";
import { NoteForm } from "@/features/tasks/note-form";
import { getTask } from "@/features/tasks/queries";
import { StatusSwitcher } from "@/features/tasks/status-switcher";
import { getRunningTimer } from "@/features/time/queries";
import { TimeEntriesList } from "@/features/time/time-entries-list";
import { TemplateFormDialog } from "@/features/templates/template-form-dialog";
import { TimerButton } from "@/features/time/timer-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "משימה — kaminer.ai" };

export default function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
      <TaskDetails params={params} />
    </Suspense>
  );
}

async function TaskDetails({ params }: Pick<PageProps<"/tasks/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [details, running, billableMinutes] = await Promise.all([
    getTask(id),
    getRunningTimer(),
    taskBillableMinutes(id),
  ]);
  if (!details) notFound();
  const { task, checklist, notes, actualMinutes, timeEntries } = details;
  const overdue = isOverdue(task.due_date, task.status, todayInJerusalem());

  return (
    <div className="grid gap-6">
      <Link href="/tasks" className="text-muted-foreground flex w-fit items-center gap-1 text-sm hover:underline">
        <ChevronRightIcon className="size-4" aria-hidden />
        כל המשימות
      </Link>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <CategoryBadge category={task.category} />
          <PriorityBadge priority={task.priority} />
          <div className="ms-auto flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/tasks/${task.id}/edit`}>
                <PencilIcon />
                עריכה
              </Link>
            </Button>
            <TemplateFormDialog
              title="שמירה כתבנית"
              template={{
                title: task.title,
                description: task.description,
                category: task.category,
                default_estimate_minutes: task.estimate_minutes,
                checklist: checklist.map((item) => item.text),
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <CopyPlusIcon />
                  שמור כתבנית
                </Button>
              }
            />
            <DeleteTaskButton taskId={task.id} />
          </div>
        </div>
        <StatusSwitcher taskId={task.id} status={task.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          {task.description && (
            <Card>
              <CardContent className="text-sm whitespace-pre-line">{task.description}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">תתי־משימות</CardTitle>
            </CardHeader>
            <CardContent>
              <Checklist taskId={task.id} items={checklist} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">הערות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <NoteForm taskId={task.id} />
              {notes.length > 0 && (
                <ul className="grid gap-3">
                  {notes.map((n) => (
                    <li key={n.id} className="bg-muted/40 rounded-md p-3 text-sm">
                      <p className="whitespace-pre-line">{n.body}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {n.profiles?.full_name ?? ""} · {formatDate(n.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פרטים</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">לקוח</dt>
                <dd>
                  {task.clients ? (
                    <Link href={`/clients/${task.clients.id}`} className="hover:underline">
                      {task.clients.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
                {task.projects && (
                  <>
                    <dt className="text-muted-foreground">פרויקט</dt>
                    <dd>
                      <Link href={`/projects/${task.projects.id}`} className="hover:underline">
                        {task.projects.name}
                      </Link>
                      <span className="text-muted-foreground"> · מתומחר בפרויקט</span>
                    </dd>
                  </>
                )}
                <dt className="text-muted-foreground">תאריך יעד</dt>
                <dd className={cn(overdue && "text-destructive font-medium")}>
                  {formatDate(task.due_date)}
                  {overdue && " (באיחור)"}
                </dd>
                <dt className="text-muted-foreground">מי מטפלת</dt>
                <dd>{task.freelancers?.full_name ?? "אני"}</dd>
                {task.freelancer_cost != null && (
                  <>
                    <dt className="text-muted-foreground">עלות פרילנסר</dt>
                    <dd>₪{task.freelancer_cost}</dd>
                  </>
                )}
                {task.task_templates && (
                  <>
                    <dt className="text-muted-foreground">מתבנית</dt>
                    <dd>
                      <Link href="/catalog" className="hover:underline">
                        {task.task_templates.title}
                      </Link>
                    </dd>
                  </>
                )}
                {task.completed_at && (
                  <>
                    <dt className="text-muted-foreground">הושלמה</dt>
                    <dd>{formatDate(task.completed_at)}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* משימה בפרויקט מתומחרת בפרויקט; משימה אישית לא מתומחרת */}
          {!task.project_id && task.category !== "personal" && (
            <PricingCard
              entity="task"
              entityId={task.id}
              pricing={{ pricing_type: task.pricing_type, hourly_rate: task.hourly_rate, final_price: task.final_price }}
              billableMinutes={billableMinutes}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">זמן</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <TimerButton
                task={{ id: task.id, title: task.title, status: task.status }}
                serverRunning={running}
              />
              <TimeProgress estimate={task.estimate_minutes} actual={actualMinutes} />
              <TimeEntriesList taskId={task.id} entries={timeEntries} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// הערכה מול בפועל: פס שהופך לאדום בחריגה
function TimeProgress({ estimate, actual }: { estimate: number | null; actual: number }) {
  if (!estimate) {
    return <p className="text-sm">בפועל: {formatMinutes(actual)} · אין הערכה</p>;
  }
  const percent = Math.round((actual / estimate) * 100);
  const over = actual > estimate;
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-sm">
        <span>
          בפועל {formatMinutes(actual)} מתוך {formatMinutes(estimate)}
        </span>
        <span className={cn("font-medium", over && "text-destructive")}>{percent}%</span>
      </div>
      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="הערכה מול זמן בפועל"
      >
        <div
          className={cn("h-full rounded-full", over ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
