"use client";

import { useActionState, useEffect, useState } from "react";
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
import { saveClient } from "./actions";

export type ClientFormValues = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  hourly_rate: number | null;
};

export function ClientFormDialog({ client, trigger }: { client?: ClientFormValues; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
          <DialogDescription>שדות עם * הם חובה.</DialogDescription>
        </DialogHeader>
        {/* key: טופס חדש בכל פתיחה, כדי שלא יישארו שגיאות קודמות */}
        {open && <ClientForm client={client} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ClientForm({ client, onDone }: { client?: ClientFormValues; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveClient, {});
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast.success(client ? "הלקוח עודכן" : "הלקוח נוסף");
      onDone();
    }
  }, [state, client, onDone]);

  return (
    <form action={action} className="grid gap-4">
      {client && <input type="hidden" name="id" value={client.id} />}
      <Field id="name" label="שם הלקוח או העסק" error={fe.name} required>
        <Input name="name" defaultValue={client?.name} required maxLength={200} autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact_name" label="איש קשר" error={fe.contact_name}>
          <Input name="contact_name" defaultValue={client?.contact_name ?? ""} />
        </Field>
        <Field id="mobile" label="נייד" error={fe.mobile}>
          <Input name="mobile" type="tel" dir="ltr" defaultValue={client?.mobile ?? ""} />
        </Field>
        <Field id="phone" label="טלפון" error={fe.phone}>
          <Input name="phone" type="tel" dir="ltr" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field id="email" label="מייל" error={fe.email}>
          <Input name="email" type="email" dir="ltr" defaultValue={client?.email ?? ""} />
        </Field>
        <Field id="website" label="אתר" error={fe.website}>
          <Input name="website" dir="ltr" placeholder="example.co.il" defaultValue={client?.website ?? ""} />
        </Field>
        <Field id="hourly_rate" label="תעריף לשעה (₪)" error={fe.hourly_rate}>
          <Input
            name="hourly_rate"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            defaultValue={client?.hourly_rate ?? ""}
          />
        </Field>
      </div>
      <Field id="notes" label="הערות" error={fe.notes}>
        <Textarea name="notes" defaultValue={client?.notes ?? ""} />
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
