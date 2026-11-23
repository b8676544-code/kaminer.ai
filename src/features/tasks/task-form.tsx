"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import type { Pricing } from "@/features/shared/pricing";
import { PricingFields } from "@/features/shared/pricing-fields";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
} from "@/features/shared/labels";
import { saveTask } from "./actions";

export type TaskFormValues = {
  id?: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  client_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimate_minutes: number | null;
  assignee_freelancer_id: string | null;
  freelancer_cost: number | null;
  project_id: string | null;
  pricing_type: Pricing["pricing_type"];
  hourly_rate: number | null;
  final_price: number | null;
  // ביצירה מתבנית בלבד
  template_id?: string | null;
  checklist?: string[];
};

type Option = { id: string; name: string };
type ClientOption = Option & { hourly_rate: number | null };
type ProjectOption = Option & { client_id: string };

export function TaskForm({
  task,
  clients,
  freelancers,
  projects,
}: {
  task: TaskFormValues;
  clients: ClientOption[];
  freelancers: Option[];
  projects: ProjectOption[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTask, {});
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [freelancerId, setFreelancerId] = useState(task.assignee_freelancer_id ?? "");
  const [clientId, setClientId] = useState(task.client_id ?? "");
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const fe = state.fieldErrors ?? {};
  const isPersonal = category === "personal";
  const isNew = !task.id;
  const clientProjects = projects.filter((p) => p.client_id === clientId);
  const clientRate = clients.find((c) => c.id === clientId)?.hourly_rate ?? null;

  return (
    <form action={action} className="grid max-w-2xl gap-5">
      {task.id && <input type="hidden" name="id" value={task.id} />}
      {isNew && task.template_id && <input type="hidden" name="template_id" value={task.template_id} />}

      <Field id="title" label="כותרת" error={fe.title} required>
        <Input name="title" defaultValue={task.title} required maxLength={300} autoFocus={isNew} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="category" label="קטגוריה" error={fe.category} required>
          <NativeSelect name="category" value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {!isPersonal && (
          <Field id="client_id" label="לקוח" error={fe.client_id} required={category === "clients"}>
            <NativeSelect
              name="client_id"
              value={clientId}
              required={category === "clients"}
              onChange={(e) => {
                setClientId(e.target.value);
                // פרויקט שייך ללקוח אחד: החלפת לקוח מנקה את הפרויקט
                setProjectId("");
              }}
            >
              <option value="">{category === "clients" ? "בחרי לקוח" : "ללא לקוח"}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        {!isPersonal && clientId && (clientProjects.length > 0 || projectId) && (
          <Field id="project_id" label="פרויקט" error={fe.project_id}>
            <NativeSelect name="project_id" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">ללא פרויקט</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        <Field id="status" label="סטטוס" error={fe.status}>
          <NativeSelect name="status" defaultValue={task.status}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="priority" label="עדיפות" error={fe.priority}>
          <NativeSelect name="priority" defaultValue={task.priority}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="due_date" label="תאריך יעד" error={fe.due_date}>
          <Input name="due_date" type="date" defaultValue={task.due_date ?? ""} />
        </Field>

        <Field id="estimate_minutes" label="הערכת זמן (דקות)" error={fe.estimate_minutes}>
          <Input
            name="estimate_minutes"
            type="number"
            min={1}
            step={1}
            dir="ltr"
            placeholder="למשל 90"
            defaultValue={task.estimate_minutes ?? ""}
          />
        </Field>

        {!isPersonal && (
          <>
            <Field id="assignee_freelancer_id" label="מי מטפלת" error={fe.assignee_freelancer_id}>
              <NativeSelect
                name="assignee_freelancer_id"
                value={freelancerId}
                onChange={(e) => setFreelancerId(e.target.value)}
              >
                <option value="">אני</option>
                {freelancers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {freelancerId && (
              <Field id="freelancer_cost" label="עלות לפרילנסר (₪)" error={fe.freelancer_cost}>
                <Input
                  name="freelancer_cost"
                  type="number"
                  min={0}
                  step="0.01"
                  dir="ltr"
                  defaultValue={task.freelancer_cost ?? ""}
                />
              </Field>
            )}
          </>
        )}
      </div>

      {!isPersonal &&
        (projectId ? (
          <p className="text-muted-foreground text-sm">המשימה מתומחרת במסגרת הפרויקט, ולכן אין לה תמחור נפרד.</p>
        ) : (
          <PricingFields
            key={clientId}
            idPrefix="task"
            values={{ pricing_type: task.pricing_type, hourly_rate: task.hourly_rate, final_price: task.final_price }}
            defaultRate={clientRate}
            errors={fe}
          />
        ))}

      <Field id="description" label="תיאור" error={fe.description}>
        <Textarea name="description" rows={4} defaultValue={task.description ?? ""} />
      </Field>

      {isNew && (
        <Field id="checklist" label="תתי־משימות (שורה לכל אחת)">
          <Textarea
            name="checklist"
            rows={Math.max(4, Math.min(task.checklist?.length ?? 0, 10))}
            placeholder={"איסוף חומרים\nכתיבה\nאישור לקוח"}
            defaultValue={task.checklist?.join("\n") ?? ""}
          />
        </Field>
      )}

      {isPersonal && (
        <p className="text-muted-foreground text-sm">משימה אישית גלויה רק לך, ולא נספרת בדוחות העסק.</p>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "שומרת…" : isNew ? "יצירת משימה" : "שמירת שינויים"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={task.id ? `/tasks/${task.id}` : "/tasks"}>ביטול</Link>
        </Button>
      </div>
    </form>
  );
}
