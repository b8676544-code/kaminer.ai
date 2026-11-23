"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import type { Pricing, PricingType } from "@/features/shared/pricing";
import { PricingFields } from "@/features/shared/pricing-fields";
import { saveProject } from "./actions";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "./schemas";

export type ProjectFormValues = Pricing & {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
};

export function ProjectFormDialog({
  clientId,
  clientRate,
  project,
  trigger,
}: {
  clientId: string;
  clientRate: number | null;
  project?: ProjectFormValues;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "עריכת פרויקט" : "פרויקט חדש"}</DialogTitle>
          <DialogDescription>פרויקט מקבץ כמה משימות של הלקוח, עם תמחור אחד לכולן.</DialogDescription>
        </DialogHeader>
        {open && (
          <ProjectForm clientId={clientId} clientRate={clientRate} project={project} onDone={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ערך מספרי מהטופס שחזר אחרי שגיאה, או מהפרויקט הקיים
function numberValue(sent: string | undefined, fallback: number | null): number | null {
  if (sent === undefined) return fallback;
  return sent === "" ? null : Number(sent);
}

function ProjectForm({
  clientId,
  clientRate,
  project,
  onDone,
}: {
  clientId: string;
  clientRate: number | null;
  project?: ProjectFormValues;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProject, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  useEffect(() => {
    if (state.ok) {
      toast.success(project ? "הפרויקט עודכן" : "הפרויקט נוצר");
      onDone();
      if (!project && state.id) router.push(`/projects/${state.id}`);
    }
  }, [state, project, onDone, router]);

  const sentType = v?.pricing_type;
  const pricing: Pricing = {
    pricing_type: sentType === undefined ? (project?.pricing_type ?? null) : ((sentType || null) as PricingType | null),
    hourly_rate: numberValue(v?.hourly_rate, project?.hourly_rate ?? null),
    final_price: numberValue(v?.final_price, project?.final_price ?? null),
  };

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="client_id" value={clientId} />
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field id="project-name" label="שם הפרויקט" error={fe.name} required>
        <Input name="name" defaultValue={v?.name ?? project?.name} required maxLength={200} autoFocus />
      </Field>
      <Field id="project-description" label="תיאור" error={fe.description}>
        <Textarea name="description" defaultValue={v?.description ?? project?.description ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="project-start" label="התחלה" error={fe.start_date}>
          <Input name="start_date" type="date" defaultValue={v?.start_date ?? project?.start_date ?? ""} />
        </Field>
        <Field id="project-end" label="סיום משוער" error={fe.end_date}>
          <Input name="end_date" type="date" defaultValue={v?.end_date ?? project?.end_date ?? ""} />
        </Field>
        {project && (
          <Field id="project-status" label="סטטוס" error={fe.status}>
            <NativeSelect name="status" defaultValue={v?.status ?? project.status}>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
      </div>
      <PricingFields idPrefix="project" values={pricing} defaultRate={clientRate} errors={fe} />
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "שומרת…" : "שמירה"}
        </Button>
      </DialogFooter>
    </form>
  );
}
