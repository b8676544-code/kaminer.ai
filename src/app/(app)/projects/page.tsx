import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listActiveClientOptions } from "@/features/clients/queries";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { listProjects } from "@/features/projects/queries";
import { PROJECT_STATUS_LABELS, projectStatusSchema, type ProjectStatus } from "@/features/projects/schemas";
import { formatDate, formatMinutes } from "@/features/shared/format";
import { computePrice, formatMoney, PRICING_LABELS } from "@/features/shared/pricing";
import { cn } from "@/lib/utils";

export const metadata = { title: "פרויקטים — kaminer.ai" };

const FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "active", label: "פעילים" },
  { value: "done", label: "הסתיימו" },
  { value: "archived", label: "ארכיון" },
  { value: "all", label: "הכל" },
];

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <div className="grid gap-6">
      <Suspense
        fallback={
          <>
            <h1 className="text-2xl font-bold">פרויקטים</h1>
            <p className="text-muted-foreground text-sm">טוען פרויקטים…</p>
          </>
        }
      >
        <ProjectsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProjectsList({ searchParams }: Pick<PageProps<"/projects">, "searchParams">) {
  const { status: rawStatus } = await searchParams;
  const parsed = projectStatusSchema.safeParse(rawStatus);
  const status: ProjectStatus | "all" = rawStatus === "all" ? "all" : parsed.success ? parsed.data : "active";
  const [projects, clients] = await Promise.all([listProjects(status), listActiveClientOptions()]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">פרויקטים</h1>
        <ProjectFormDialog
          clients={clients}
          trigger={
            <Button size="sm" className="ms-auto">
              <PlusIcon />
              פרויקט חדש
            </Button>
          }
        />
      </div>

      <div className="grid gap-4">
        <nav aria-label="סינון פרויקטים" className="bg-muted inline-flex w-fit rounded-lg p-1 text-sm">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "active" ? "/projects" : `/projects?status=${f.value}`}
              aria-current={status === f.value ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1",
                status === f.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground",
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {projects.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            {status === "active"
              ? "אין פרויקטים פעילים. פרויקט מקבץ כמה משימות של לקוח עם תמחור אחד. אפשר להוסיף בכפתור למעלה."
              : "אין פרויקטים בסינון הזה."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פרויקט</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>משימות פתוחות</TableHead>
                  <TableHead>שעות לחיוב</TableHead>
                  <TableHead>תמחור</TableHead>
                  <TableHead>סיום משוער</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const { final } = computePrice(p, p.billableMinutes);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.clients ? (
                          <Link href={`/clients/${p.client_id}`} className="hover:underline">
                            {p.clients.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "secondary"}>
                          {PROJECT_STATUS_LABELS[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.openTaskCount} מתוך {p.taskCount}
                      </TableCell>
                      <TableCell>{formatMinutes(p.billableMinutes)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.pricing_type ? (
                          <>
                            <span className="text-muted-foreground">{PRICING_LABELS[p.pricing_type]} · </span>
                            <span className="font-medium">{formatMoney(final)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">לא מתומחר</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(p.end_date)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
