import { Suspense } from "react";
import Link from "next/link";
import { KanbanSquareIcon, ListIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listActiveClientOptions } from "@/features/clients/queries";
import { listActiveFreelancerOptions } from "@/features/freelancers/queries";
import { listProjectOptions } from "@/features/projects/queries";
import { formatDate, formatMinutes, isOverdue, todayInJerusalem } from "@/features/shared/format";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/features/tasks/badges";
import { KanbanBoard } from "@/features/tasks/kanban-board";
import { listTasks, type TaskListItem } from "@/features/tasks/queries";
import { taskFiltersSchema, type TaskFilters } from "@/features/tasks/schemas";
import { TaskFiltersBar } from "@/features/tasks/task-filters";
import { getRunningTimer, type RunningTimer } from "@/features/time/queries";
import { TimerButton } from "@/features/time/timer-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "משימות — kaminer.ai" };

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">משימות</h1>
        <Button asChild size="sm" className="ms-auto">
          <Link href="/tasks/new">
            <PlusIcon />
            משימה חדשה
          </Link>
        </Button>
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען משימות…</p>}>
        <TasksView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function toQuery(filters: TaskFilters, view: "list" | "board") {
  const params = new URLSearchParams();
  for (const key of ["status", "category", "client", "freelancer", "project"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (view === "board") params.set("view", "board");
  const qs = params.toString();
  return qs ? `/tasks?${qs}` : "/tasks";
}

async function TasksView({ searchParams }: Pick<PageProps<"/tasks">, "searchParams">) {
  const raw = await searchParams;
  const filters = taskFiltersSchema.parse({
    client: raw.client,
    category: raw.category,
    status: raw.status,
    freelancer: raw.freelancer,
    project: raw.project,
    view: raw.view,
  });
  const view = filters.view ?? "list";

  const [tasks, clients, freelancers, running, projects] = await Promise.all([
    // בקנבן הסטטוס הוא העמודות, ולכן לא מסננים לפיו
    listTasks(view === "board" ? { ...filters, status: undefined } : filters),
    listActiveClientOptions(),
    listActiveFreelancerOptions(),
    getRunningTimer(),
    // פרויקט שנבחר בסינון נשאר ברשימה גם אם הסתיים
    listProjectOptions(filters.project),
  ]);
  const today = todayInJerusalem();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <TaskFiltersBar
            filters={filters}
            clients={clients}
            freelancers={freelancers.map((f) => ({ id: f.id, name: f.full_name }))}
            projects={projects}
          />
        </div>
        <nav aria-label="תצוגה" className="bg-muted inline-flex rounded-lg p-1 text-sm">
          {(
            [
              ["list", "רשימה", ListIcon],
              ["board", "קנבן", KanbanSquareIcon],
            ] as const
          ).map(([v, label, Icon]) => (
            <Link
              key={v}
              href={toQuery(filters, v)}
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
      </div>

      {view === "board" ? (
        <KanbanBoard tasks={tasks} today={today} />
      ) : (
        <TasksTable tasks={tasks} today={today} running={running} />
      )}
    </div>
  );
}

function TasksTable({ tasks, today, running }: { tasks: TaskListItem[]; today: string; running: RunningTimer | null }) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        אין משימות שמתאימות לסינון.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">שעון</span>
            </TableHead>
            <TableHead>משימה</TableHead>
            <TableHead>קטגוריה</TableHead>
            <TableHead>לקוח</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>תאריך יעד</TableHead>
            <TableHead>הערכה</TableHead>
            <TableHead>מטפלת</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const overdue = isOverdue(t.due_date, t.status, today);
            return (
              <TableRow key={t.id}>
                <TableCell>
                  {(t.status !== "done" || running?.taskId === t.id) && (
                    <TimerButton task={{ id: t.id, title: t.title, status: t.status }} serverRunning={running} compact />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/tasks/${t.id}`} className="hover:underline">
                      {t.title}
                    </Link>
                    <PriorityBadge priority={t.priority} />
                  </div>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={t.category} />
                </TableCell>
                <TableCell>
                  {t.clients && t.client_id ? (
                    <Link href={`/clients/${t.client_id}`} className="hover:underline">
                      {t.clients.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                  {t.projects && t.project_id && (
                    <Link
                      href={`/projects/${t.project_id}`}
                      className="text-muted-foreground block text-xs hover:underline"
                    >
                      {t.projects.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className={cn("whitespace-nowrap", overdue && "text-destructive font-medium")}>
                  {formatDate(t.due_date)}
                </TableCell>
                <TableCell>{formatMinutes(t.estimate_minutes)}</TableCell>
                <TableCell>{t.freelancers?.full_name ?? "אני"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
