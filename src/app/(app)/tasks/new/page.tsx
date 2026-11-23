import { Suspense } from "react";
import { z } from "zod";

import { listActiveClientOptions } from "@/features/clients/queries";
import { listActiveFreelancerOptions } from "@/features/freelancers/queries";
import { listProjectOptions } from "@/features/projects/queries";
import { TaskForm, type TaskFormValues } from "@/features/tasks/task-form";
import { getActiveTemplate, listActiveTemplateOptions } from "@/features/templates/queries";
import { TemplatePicker } from "@/features/templates/template-picker";

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
  const { client, project, template: templateParam } = await searchParams;
  const parsedTemplate = z.guid().safeParse(templateParam);
  const templateId = parsedTemplate.success ? parsedTemplate.data : null;

  const [clients, freelancers, templateOptions, template, projects] = await Promise.all([
    listActiveClientOptions(typeof client === "string" ? client : null),
    listActiveFreelancerOptions(),
    listActiveTemplateOptions(),
    templateId ? getActiveTemplate(templateId) : null,
    listProjectOptions(),
  ]);
  // לקוח מראש (מכפתור "משימה ללקוח"), רק אם הוא באמת ברשימה
  const presetClient = typeof client === "string" && clients.some((c) => c.id === client) ? client : null;

  // פרויקט מראש (מכפתור "משימה בפרויקט"), רק אם הוא פעיל ושייך ללקוח שנבחר
  const presetProject =
    presetClient && typeof project === "string" && projects.some((p) => p.id === project && p.client_id === presetClient)
      ? project
      : null;

  const category = template?.category ?? (presetClient ? "clients" : "business");
  const task: TaskFormValues = {
    title: template?.title ?? "",
    description: template?.description ?? null,
    category,
    // משימה אישית לא משויכת ללקוח
    client_id: category === "personal" ? null : presetClient,
    status: "todo",
    priority: "normal",
    due_date: null,
    estimate_minutes: template?.default_estimate_minutes ?? null,
    assignee_freelancer_id: null,
    freelancer_cost: null,
    project_id: category === "personal" ? null : presetProject,
    pricing_type: null,
    hourly_rate: null,
    final_price: null,
    template_id: template?.id ?? null,
    checklist: template?.checklist ?? [],
  };

  return (
    <div className="grid gap-5">
      <TemplatePicker templates={templateOptions} selected={template?.id ?? null} />
      {templateId && !template && (
        <p role="alert" className="text-destructive text-sm">
          התבנית לא נמצאה או שהיא בארכיון. אפשר לבחור תבנית אחרת או ליצור משימה ייחודית.
        </p>
      )}
      {/* key: הטופס נטען מחדש כשמחליפים תבנית, כדי שה-defaultValue יתעדכן */}
      <TaskForm
        key={template?.id ?? "blank"}
        task={task}
        clients={clients}
        freelancers={freelancers.map((f) => ({ id: f.id, name: f.full_name }))}
        projects={projects}
      />
    </div>
  );
}
