"use client";

import Form from "next/form";
import Link from "next/link";

import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_LABELS,
  OWN_BUSINESS_FILTER,
  OWN_BUSINESS_LABEL,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_STATUSES,
} from "@/features/shared/labels";
import type { TaskFilters } from "./schemas";

type Option = { id: string; name: string };

// סינון דרך ה-URL (GET), כך שאפשר לשמור קישור לתצוגה מסוננת. שינוי שדה מגיש מיד.
export function TaskFiltersBar({
  filters,
  clients,
  freelancers,
  projects,
}: {
  filters: TaskFilters;
  clients: Option[];
  freelancers: Option[];
  projects: Option[];
}) {
  const hasFilters = Boolean(
    filters.client || filters.category || filters.status || filters.freelancer || filters.project,
  );
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    // QA-3: key מחדש את הטופס כשה-URL משתנה (חזרה אחורה, ניקוי), כדי שהבחירות לא יישארו ישנות
    <Form key={JSON.stringify(filters)} action="/tasks" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      {filters.view === "board" && <input type="hidden" name="view" value="board" />}
      <div className="grid gap-1.5">
        <Label htmlFor="f-status">סטטוס</Label>
        <NativeSelect id="f-status" name="status" defaultValue={filters.status ?? ""} onChange={submit}>
          <option value="">הכול</option>
          <option value="open">פתוחות (לא הושלמו)</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="f-category">קטגוריה</Label>
        <NativeSelect id="f-category" name="category" defaultValue={filters.category ?? ""} onChange={submit}>
          <option value="">הכול</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="f-client">לקוח</Label>
        <NativeSelect id="f-client" name="client" defaultValue={filters.client ?? ""} onChange={submit}>
          <option value="">הכול</option>
          <option value={OWN_BUSINESS_FILTER}>{OWN_BUSINESS_LABEL}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {(projects.length > 0 || filters.project) && (
        <div className="grid gap-1.5">
          <Label htmlFor="f-project">פרויקט</Label>
          <NativeSelect id="f-project" name="project" defaultValue={filters.project ?? ""} onChange={submit}>
            <option value="">הכול</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="f-freelancer">פרילנסר</Label>
        <NativeSelect id="f-freelancer" name="freelancer" defaultValue={filters.freelancer ?? ""} onChange={submit}>
          <option value="">הכול</option>
          {freelancers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex items-center gap-3">
        <noscript>
          <button type="submit">סינון</button>
        </noscript>
        {hasFilters && (
          <Link
            href={filters.view === "board" ? "/tasks?view=board" : "/tasks"}
            className="text-muted-foreground text-sm underline underline-offset-4"
          >
            ניקוי סינון
          </Link>
        )}
      </div>
    </Form>
  );
}
