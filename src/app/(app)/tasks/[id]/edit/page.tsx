import { Suspense } from "react";
import { notFound } from "next/navigation";

import { listActiveClientOptions } from "@/features/clients/queries";
import { listActiveFreelancerOptions } from "@/features/freelancers/queries";
import { listProjectOptions } from "@/features/projects/queries";
import { getTask } from "@/features/tasks/queries";
import { TaskForm } from "@/features/tasks/task-form";

export const metadata = { title: "עריכת משימה — kaminer.ai" };

export default function EditTaskPage({ params }: PageProps<"/tasks/[id]/edit">) {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">עריכת משימה</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
        <EditTaskForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditTaskForm({ params }: Pick<PageProps<"/tasks/[id]/edit">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [details, clients, freelancers] = await Promise.all([
    getTask(id),
    listActiveClientOptions(),
    listActiveFreelancerOptions(),
  ]);
  if (!details) notFound();
  const { task } = details;
  // פרויקט שכבר משויך נשאר ברשימה גם אם הסתיים
  const projects = await listProjectOptions(task.project_id);

  // לקוח בארכיון או פרילנסר לא פעיל שכבר משויכים: נשארים ברשימה כדי שלא יימחקו בשמירה
  const clientOptions = [...clients];
  if (task.clients && !clientOptions.some((c) => c.id === task.clients!.id)) {
    clientOptions.push({
      id: task.clients.id,
      name: `${task.clients.name} (ארכיון)`,
      hourly_rate: task.clients.hourly_rate,
    });
  }
  const freelancerOptions = freelancers.map((f) => ({ id: f.id, name: f.full_name }));
  if (task.freelancers && !freelancerOptions.some((f) => f.id === task.freelancers!.id)) {
    freelancerOptions.push({ id: task.freelancers.id, name: `${task.freelancers.full_name} (לא פעיל)` });
  }

  return <TaskForm task={task} clients={clientOptions} freelancers={freelancerOptions} projects={projects} />;
}
