import { Suspense } from "react";

import { listActiveClientOptions } from "@/features/clients/queries";
import { listActiveFreelancerOptions } from "@/features/freelancers/queries";
import { TaskForm, type TaskFormValues } from "@/features/tasks/task-form";

export const metadata = { title: "משימה חדשה — kaminer.ai" };

export default function NewTaskPage({ searchParams }: PageProps<"/tasks/new">) {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">משימה חדשה</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
        <NewTaskForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewTaskForm({ searchParams }: Pick<PageProps<"/tasks/new">, "searchParams">) {
  const [{ client }, clients, freelancers] = await Promise.all([
    searchParams,
    listActiveClientOptions(),
    listActiveFreelancerOptions(),
  ]);
  // לקוח מראש (מכפתור "משימה ללקוח"), רק אם הוא באמת ברשימה
  const presetClient = typeof client === "string" && clients.some((c) => c.id === client) ? client : null;

  const task: TaskFormValues = {
    title: "",
    description: null,
    category: presetClient ? "clients" : "business",
    client_id: presetClient,
    status: "todo",
    priority: "normal",
    due_date: null,
    estimate_minutes: null,
    assignee_freelancer_id: null,
    freelancer_cost: null,
  };

  return (
    <TaskForm
      task={task}
      clients={clients}
      freelancers={freelancers.map((f) => ({ id: f.id, name: f.full_name }))}
    />
  );
}
