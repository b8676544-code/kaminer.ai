"use client";

import { useActionState, useEffect, useState } from "react";
import { useSubmitGuard } from "@/features/shared/use-submit-guard";
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
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import { saveFreelancer } from "./actions";

export type FreelancerFormValues = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  default_hourly_cost: number | null;
  notes: string | null;
};

export function FreelancerFormDialog({
  freelancer,
  trigger,
}: {
  freelancer?: FreelancerFormValues;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{freelancer ? "עריכת פרילנסר" : "פרילנסר חדש"}</DialogTitle>
          <DialogDescription>שדות עם * הם חובה.</DialogDescription>
        </DialogHeader>
        {open && <FreelancerForm freelancer={freelancer} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function FreelancerForm({ freelancer, onDone }: { freelancer?: FreelancerFormValues; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveFreelancer, {});
  const guardSubmit = useSubmitGuard(pending);
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  useEffect(() => {
    if (state.ok) {
      toast.success(freelancer ? "הפרילנסר עודכן" : "הפרילנסר נוסף");
      onDone();
    }
  }, [state, freelancer, onDone]);

  return (
    <form action={action} onSubmit={guardSubmit} className="grid gap-4">
      {freelancer && <input type="hidden" name="id" value={freelancer.id} />}
      <Field id="full_name" label="שם מלא" error={fe.full_name} required>
        <Input name="full_name" defaultValue={v?.full_name ?? freelancer?.full_name} required maxLength={200} autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="specialty" label="תחום" error={fe.specialty}>
          <Input name="specialty" placeholder="למשל עיצוב גרפי" defaultValue={v?.specialty ?? freelancer?.specialty ?? ""} />
        </Field>
        <Field id="default_hourly_cost" label="עלות לשעה (₪)" error={fe.default_hourly_cost}>
          <Input
            name="default_hourly_cost"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            defaultValue={v?.default_hourly_cost ?? freelancer?.default_hourly_cost ?? ""}
          />
        </Field>
        <Field id="phone" label="טלפון" error={fe.phone}>
          <Input name="phone" type="tel" dir="ltr" defaultValue={v?.phone ?? freelancer?.phone ?? ""} />
        </Field>
        <Field id="email" label="מייל" error={fe.email}>
          <Input name="email" type="email" dir="ltr" defaultValue={v?.email ?? freelancer?.email ?? ""} />
        </Field>
      </div>
      <Field id="notes" label="הערות" error={fe.notes}>
        <Textarea name="notes" defaultValue={v?.notes ?? freelancer?.notes ?? ""} />
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
