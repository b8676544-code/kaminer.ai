"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { CATEGORY_LABELS, TASK_CATEGORIES, type TaskCategory } from "@/features/shared/labels";
import { saveTemplate } from "./actions";

export type TemplateFormValues = {
  id?: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  default_estimate_minutes: number | null;
  checklist: string[];
};

// דיאלוג אחד ליצירה, לעריכה ול"שמור כתבנית" (ערכים התחלתיים בלי id)
export function TemplateFormDialog({
  template,
  trigger,
  title,
}: {
  template?: TemplateFormValues;
  trigger: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(template?.id);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? (isEdit ? "עריכת תבנית" : "תבנית חדשה")}</DialogTitle>
          <DialogDescription>שדות עם * הם חובה.</DialogDescription>
        </DialogHeader>
        {/* טופס חדש בכל פתיחה, כדי שלא יישארו שגיאות קודמות */}
        {open && <TemplateForm template={template} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TemplateForm({ template, onDone }: { template?: TemplateFormValues; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTemplate, {});
  const fe = state.fieldErrors ?? {};
  // אחרי שגיאה React מאפס את הטופס, לכן מחזירים את מה שנשלח
  const v = state.values;
  const isEdit = Boolean(template?.id);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!state.ok) return;
    if (isEdit) {
      toast.success("התבנית עודכנה");
    } else {
      toast.success("התבנית נשמרה בקטלוג", {
        // מחוץ לקטלוג (מ"שמור כתבנית") מציעים קישור אליו
        action: pathname.startsWith("/catalog")
          ? undefined
          : { label: "לקטלוג", onClick: () => router.push("/catalog") },
      });
    }
    onDone();
  }, [state, isEdit, onDone, router, pathname]);

  return (
    <form action={action} className="grid gap-4">
      {template?.id && <input type="hidden" name="id" value={template.id} />}
      <Field id="tpl-title" label="כותרת" error={fe.title} required>
        <Input name="title" defaultValue={v?.title ?? template?.title} required maxLength={300} autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="tpl-category" label="קטגוריה" error={fe.category} required>
          <NativeSelect name="category" defaultValue={v?.category ?? template?.category ?? "business"}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="tpl-estimate" label="הערכת זמן (דקות)" error={fe.default_estimate_minutes}>
          <Input
            name="default_estimate_minutes"
            type="number"
            min={1}
            step={1}
            dir="ltr"
            defaultValue={v?.default_estimate_minutes ?? template?.default_estimate_minutes ?? ""}
          />
        </Field>
      </div>
      <Field id="tpl-description" label="תיאור" error={fe.description}>
        <Textarea name="description" defaultValue={v?.description ?? template?.description ?? ""} />
      </Field>
      <Field id="tpl-checklist" label="תתי־משימות (שורה לכל אחת)" error={fe.checklist}>
        <Textarea
          name="checklist"
          rows={5}
          placeholder={"איסוף חומרים\nכתיבה\nאישור לקוח"}
          defaultValue={v?.checklist ?? template?.checklist.join("\n") ?? ""}
        />
      </Field>
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
