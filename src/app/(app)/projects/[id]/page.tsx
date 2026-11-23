import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { getProject } from "@/features/projects/queries";
import { PROJECT_STATUS_LABELS } from "@/features/projects/schemas";
import { formatDate, formatMinutes } from "@/features/shared/format";
import { PricingCard } from "@/features/shared/pricing-card";
import { PriorityBadge, StatusBadge } from "@/features/tasks/badges";

export const metadata = { title: "פרויקט — kaminer.ai" };

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
      <ProjectDetails params={params} />
    </Suspense>
  );
}

async function ProjectDetails({ params }: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const details = await getProject(id);
  if (!details) notFound();
  const { project, tasks, billableMinutes } = details;
  const client = project.clients;
  const openTasks = tasks.filter((t) => t.status !== "done");
  const estimate = tasks.reduce((sum, t) => sum + (t.estimate_minutes ?? 0), 0);

  return (
    <div className="grid gap-6">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-sm">
        <Link href="/projects" className="flex w-fit items-center gap-1 hover:underline">
          <ChevronRightIcon className="size-4" aria-hidden />
          כל הפרויקטים
        </Link>
        {client && (
          <Link href={`/clients/${client.id}`} className="hover:underline">
            · {client.name}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge variant={project.status === "active" ? "default" : "secondary"}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/tasks/new?client=${project.client_id}&project=${project.id}`}>
              <PlusIcon />
              משימה בפרויקט
            </Link>
          </Button>
          <ProjectFormDialog
            clientId={project.client_id}
            clientRate={client?.hourly_rate ?? null}
            project={project}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon />
                עריכה
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          {project.description && (
            <Card>
              <CardContent className="text-sm whitespace-pre-line">{project.description}</CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                משימות ({openTasks.length} פתוחות מתוך {tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">עוד אין משימות בפרויקט.</p>
              ) : (
                <ul className="divide-y">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                      <Link href={`/tasks/${t.id}`} className="font-medium hover:underline">
                        {t.title}
                      </Link>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <span className="text-muted-foreground ms-auto">{formatDate(t.due_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <PricingCard
            entity="project"
            entityId={project.id}
            pricing={{
              pricing_type: project.pricing_type,
              hourly_rate: project.hourly_rate,
              final_price: project.final_price,
            }}
            billableMinutes={billableMinutes}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פרטים</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">התחלה</dt>
                <dd>{formatDate(project.start_date)}</dd>
                <dt className="text-muted-foreground">סיום משוער</dt>
                <dd>{formatDate(project.end_date)}</dd>
                <dt className="text-muted-foreground">הערכת זמן</dt>
                <dd>{estimate ? formatMinutes(estimate) : "—"}</dd>
                <dt className="text-muted-foreground">בפועל (לחיוב)</dt>
                <dd>{formatMinutes(billableMinutes)}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
