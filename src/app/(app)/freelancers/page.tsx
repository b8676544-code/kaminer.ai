import { Suspense } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveToggle } from "@/features/freelancers/active-toggle";
import { FreelancerFormDialog } from "@/features/freelancers/freelancer-form-dialog";
import { listFreelancers } from "@/features/freelancers/queries";

export const metadata = { title: "פרילנסרים — kaminer.ai" };

export default function FreelancersPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">פרילנסרים</h1>
        <FreelancerFormDialog
          trigger={
            <Button size="sm" className="ms-auto">
              <PlusIcon />
              פרילנסר חדש
            </Button>
          }
        />
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
        <FreelancersTable />
      </Suspense>
    </div>
  );
}

async function FreelancersTable() {
  const freelancers = await listFreelancers();
  if (freelancers.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        אין עדיין פרילנסרים. אפשר להוסיף בכפתור למעלה.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שם</TableHead>
            <TableHead>תחום</TableHead>
            <TableHead>טלפון</TableHead>
            <TableHead>עלות לשעה</TableHead>
            <TableHead>משימות פתוחות</TableHead>
            <TableHead>
              <span className="sr-only">פעולות</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {freelancers.map((f) => (
            <TableRow key={f.id} className={f.is_active ? undefined : "opacity-60"}>
              <TableCell className="font-medium">
                {f.full_name}
                {!f.is_active && (
                  <Badge variant="secondary" className="ms-2">
                    לא פעיל
                  </Badge>
                )}
              </TableCell>
              <TableCell>{f.specialty ?? "—"}</TableCell>
              <TableCell dir="ltr" className="text-end whitespace-nowrap">
                {f.phone ?? "—"}
              </TableCell>
              <TableCell>{f.default_hourly_cost != null ? `₪${f.default_hourly_cost}` : "—"}</TableCell>
              <TableCell>
                {f.openTasks > 0 ? (
                  <Link href={`/tasks?freelancer=${f.id}`} className="hover:underline">
                    {f.openTasks}
                  </Link>
                ) : (
                  0
                )}
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-1">
                  <FreelancerFormDialog
                    freelancer={f}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`עריכת ${f.full_name}`}>
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <ActiveToggle id={f.id} isActive={f.is_active} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
