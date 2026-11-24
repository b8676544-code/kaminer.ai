"use client";

import { useActionState, useState } from "react";
import { useSubmitGuard } from "@/features/shared/use-submit-guard";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import { formatMoney, type Pricing } from "@/features/shared/pricing";
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
  project_share: number | null;
  billed_separately: boolean;
  freelancer_cost_in_project: boolean;
  // ביצירה מתבנית בלבד
  template_id?: string | null;
  checklist?: string[];
};

type Option = { id: string; name: string };
type ClientOption = Option & { hourly_rate: number | null };
type ProjectOption = Option & {
  client_id: string;
  // המחיר הכללי (גלובלי או סופי שנקבע) והחלקים שכבר חולקו למשימות, לרמז "נשאר לחלק"
  price: number | null;
  shares: { task_id: string; share: number }[];
};

// בחירה בין שתי אפשרויות, נשלחת כ-"true"/"false"
function Choice({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  options: [string, string]; // [false, true]
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={String(value)} />
      <div role="radiogroup" aria-label={label} className="bg-muted flex w-fit gap-1 rounded-md p-1 text-sm">
        {[false, true].map((v, i) => (
          <button
            key={options[i]}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={
              value === v ? "bg-background rounded px-3 py-1 font-medium shadow-sm" : "text-muted-foreground rounded px-3 py-1"
            }
          >
            {options[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  const guardSubmit = useSubmitGuard(pending);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [freelancerId, setFreelancerId] = useState(task.assignee_freelancer_id ?? "");
  const [clientId, setClientId] = useState(task.client_id ?? "");
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [billedSeparately, setBilledSeparately] = useState(task.billed_separately);
  const [freelancerInProject, setFreelancerInProject] = useState(task.freelancer_cost_in_project);
  const fe = state.fieldErrors ?? {};
  // QA-4: אחרי שגיאה React מאפס את הטופס, ולכן השדות מקבלים את מה שנשלח ולא את הערך המקורי
  const v = state.values;
  const sent = (name: string, fallback: string | number | null | undefined) => v?.[name] ?? fallback ?? "";
  const sentNumber = (name: string, fallback: number | null) =>
    v?.[name] === undefined ? fallback : v[name] === "" ? null : Number(v[name]);
  const pricing: Pricing = {
    pricing_type:
      v?.pricing_type === undefined ? task.pricing_type : ((v.pricing_type || null) as Pricing["pricing_type"]),
    hourly_rate: sentNumber("hourly_rate", task.hourly_rate),
    final_price: sentNumber("final_price", task.final_price),
  };
  const isPersonal = category === "personal";
  const isNew = !task.id;
  // פרויקט שהלקוח שלו לא ברשימה (למשל בארכיון) לא מוצע, חוץ מהפרויקט שכבר משויך
  const selectableProjects = projects.filter(
    (p) => p.id === task.project_id || clients.some((c) => c.id === p.client_id),
  );
  // בלי לקוח: כל הפרויקטים, ובחירת פרויקט ממלאת את הלקוח. עם לקוח: רק הפרויקטים שלו
  const projectChoices = clientId ? selectableProjects.filter((p) => p.client_id === clientId) : selectableProjects;
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name;
  const clientRate = clients.find((c) => c.id === clientId)?.hourly_rate ?? null;
  const project = projects.find((p) => p.id === projectId);
  // מה כבר חולק למשימות אחרות בפרויקט (בלי המשימה הנערכת)
  const sharedToOthers = project?.shares.filter((s) => s.task_id !== task.id).reduce((sum, s) => sum + s.share, 0) ?? 0;

  return (
    <form action={action} onSubmit={guardSubmit} className="grid max-w-2xl gap-5">
      {task.id && <input type="hidden" name="id" value={task.id} />}
      {isNew && task.template_id && <input type="hidden" name="template_id" value={task.template_id} />}

      <Field id="title" label="כותרת" error={fe.title} required>
        <Input name="title" defaultValue={sent("title", task.title)} required maxLength={300} autoFocus={isNew} />
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

        {!isPersonal && (projectChoices.length > 0 || projectId) && (
          <Field id="project_id" label="פרויקט" error={fe.project_id}>
            <NativeSelect
              name="project_id"
              value={projectId}
              onChange={(e) => {
                const id = e.target.value;
                setProjectId(id);
                const chosen = projects.find((p) => p.id === id);
                if (chosen) setClientId(chosen.client_id);
              }}
            >
              <option value="">ללא פרויקט</option>
              {projectChoices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!clientId && clientName(p.client_id) ? ` (${clientName(p.client_id)})` : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        <Field id="status" label="סטטוס" error={fe.status}>
          <NativeSelect name="status" defaultValue={sent("status", task.status)}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="priority" label="עדיפות" error={fe.priority}>
          <NativeSelect name="priority" defaultValue={sent("priority", task.priority)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="due_date" label="תאריך יעד" error={fe.due_date}>
          <Input name="due_date" type="date" defaultValue={sent("due_date", task.due_date)} />
        </Field>

        <Field id="estimate_minutes" label="הערכת זמן (דקות)" error={fe.estimate_minutes}>
          <Input
            name="estimate_minutes"
            type="number"
            min={1}
            step={1}
            dir="ltr"
            placeholder="למשל 90"
            defaultValue={sent("estimate_minutes", task.estimate_minutes)}
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
                  defaultValue={sent("freelancer_cost", task.freelancer_cost)}
                />
              </Field>
            )}
          </>
        )}
      </div>

      {!isPersonal && projectId && freelancerId && (
        <Choice
          name="freelancer_cost_in_project"
          label="עלות הפרילנסר"
          value={freelancerInProject}
          onChange={setFreelancerInProject}
          options={["הוצאה נפרדת", "מתוך תקציב הפרויקט"]}
        />
      )}

      {!isPersonal &&
        (projectId ? (
          <fieldset className="grid gap-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">תמחור מול הלקוח</legend>
            <Choice
              name="billed_separately"
              label="המשימה"
              value={billedSeparately}
              onChange={setBilledSeparately}
              options={["כלולה במחיר הפרויקט", "במחיר נפרד"]}
            />
            {billedSeparately ? (
              <PricingFields
                key={`${clientId}-separate`}
                idPrefix="task"
                values={pricing}
                defaultRate={clientRate}
                errors={fe}
              />
            ) : (
              <div className="grid gap-1.5">
                <Field id="project_share" label="חלק מהמחיר הכללי (₪)" error={fe.project_share}>
                  <Input
                    name="project_share"
                    type="number"
                    min={0}
                    step="0.01"
                    dir="ltr"
                    placeholder="לא חובה"
                    defaultValue={sent("project_share", task.project_share)}
                    className="max-w-48"
                  />
                </Field>
                {project?.price != null && (
                  <p className="text-muted-foreground text-xs">
                    מחיר הפרויקט {formatMoney(project.price)} · חולק למשימות אחרות {formatMoney(sharedToOthers)} · נשאר
                    לחלק {formatMoney(project.price - sharedToOthers)}
                  </p>
                )}
              </div>
            )}
          </fieldset>
        ) : (
          <PricingFields
            key={clientId}
            idPrefix="task"
            values={pricing}
            defaultRate={clientRate}
            errors={fe}
          />
        ))}

      <Field id="description" label="תיאור" error={fe.description}>
        <Textarea name="description" rows={4} defaultValue={sent("description", task.description)} />
      </Field>

      {isNew && (
        <Field id="checklist" label="תתי־משימות (שורה לכל אחת)">
          <Textarea
            name="checklist"
            rows={Math.max(4, Math.min(task.checklist?.length ?? 0, 10))}
            placeholder={"איסוף חומרים\nכתיבה\nאישור לקוח"}
            defaultValue={sent("checklist", task.checklist?.join("\n"))}
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
