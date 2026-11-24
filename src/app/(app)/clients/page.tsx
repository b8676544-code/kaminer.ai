import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientFormDialog } from "@/features/clients/client-form-dialog";
import { listClients } from "@/features/clients/queries";
import { formatMinutes } from "@/features/shared/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "לקוחות — kaminer.ai" };

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <ClientFormDialog
          trigger={
            <Button size="sm" className="ms-auto">
              <PlusIcon />
              לקוח חדש
            </Button>
          }
        />
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען לקוחות…</p>}>
        <ClientsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ClientsList({ searchParams }: Pick<PageProps<"/clients">, "searchParams">) {
  const { status: rawStatus } = await searchParams;
  const status = rawStatus === "archived" ? "archived" : "active";
  const clients = await listClients(status);

  return (
    <div className="grid gap-4">
      <nav aria-label="סינון לקוחות" className="bg-muted inline-flex w-fit rounded-lg p-1 text-sm">
        {(["active", "archived"] as const).map((s) => (
          <Link
            key={s}
            href={s === "active" ? "/clients" : "/clients?status=archived"}
            aria-current={status === s ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1",
              status === s ? "bg-background font-medium shadow-sm" : "text-muted-foreground",
            )}
          >
            {s === "active" ? "פעילים" : "ארכיון"}
          </Link>
        ))}
      </nav>

      {clients.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {status === "active" ? "אין עדיין לקוחות. אפשר להוסיף לקוח בכפתור למעלה." : "אין לקוחות בארכיון."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>לקוח</TableHead>
                <TableHead>איש קשר</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>משימות פתוחות</TableHead>
                <TableHead>שעות החודש</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>{c.contact_name ?? "—"}</TableCell>
                  <TableCell dir="ltr" className="text-end whitespace-nowrap">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell>{c.openTasks}</TableCell>
                  <TableCell>{formatMinutes(c.monthMinutes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
