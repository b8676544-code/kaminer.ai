"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useSubmitGuard } from "@/features/shared/use-submit-guard";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/shared/field";
import type { ActionState } from "@/features/shared/form";
import { deleteContact, saveContact } from "./actions";

export type ContactItem = {
  id: string;
  name: string;
  role: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

// אנשי קשר נוספים בכרטיס "פרטי קשר" של הלקוח
export function ClientContacts({ clientId, contacts }: { clientId: string; contacts: ContactItem[] }) {
  // null: סגור · "new": איש קשר חדש · אחרת: עריכה
  const [editing, setEditing] = useState<ContactItem | "new" | null>(null);

  return (
    <div className="mt-4 grid gap-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">אנשי קשר נוספים</h3>
        <Button variant="ghost" size="sm" onClick={() => setEditing("new")}>
          <PlusIcon />
          הוספה
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-muted-foreground text-sm">אין אנשי קשר נוספים.</p>
      ) : (
        <ul className="grid gap-3">
          {contacts.map((c) => (
            <li key={c.id} className="grid gap-0.5 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-medium">{c.name}</span>
                {c.role && <span className="text-muted-foreground">· {c.role}</span>}
                <div className="ms-auto flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`עריכת ${c.name}`}
                    onClick={() => setEditing(c)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <DeleteContactButton contact={c} />
                </div>
              </div>
              {c.mobile && (
                <a href={`tel:${c.mobile}`} dir="ltr" className="w-fit">
                  {c.mobile}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} dir="ltr" className="w-fit">
                  {c.phone}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} dir="ltr" className="w-fit">
                  {c.email}
                </a>
              )}
              {c.notes && <p className="text-muted-foreground whitespace-pre-line">{c.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && editing !== "new" ? "עריכת איש קשר" : "איש קשר חדש"}</DialogTitle>
            <DialogDescription>שדות עם * הם חובה.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <ContactForm
              key={editing === "new" ? "new" : editing.id}
              clientId={clientId}
              contact={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactForm({ clientId, contact, onDone }: { clientId: string; contact?: ContactItem; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveContact, {});
  const guardSubmit = useSubmitGuard(pending);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast.success(contact ? "איש הקשר עודכן" : "איש הקשר נוסף");
      onDone();
    }
  }, [state, contact, onDone]);

  return (
    <form action={action} onSubmit={guardSubmit} className="grid gap-4">
      <input type="hidden" name="client_id" value={clientId} />
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="שם" error={fe.name} required>
          <Input name="name" defaultValue={contact?.name} required maxLength={200} autoFocus />
        </Field>
        <Field id="contact-role" label="תפקיד" error={fe.role}>
          <Input name="role" defaultValue={contact?.role ?? ""} placeholder="למשל: הנהלת חשבונות" />
        </Field>
        <Field id="contact-mobile" label="נייד" error={fe.mobile}>
          <Input name="mobile" type="tel" dir="ltr" defaultValue={contact?.mobile ?? ""} />
        </Field>
        <Field id="contact-phone" label="טלפון" error={fe.phone}>
          <Input name="phone" type="tel" dir="ltr" defaultValue={contact?.phone ?? ""} />
        </Field>
        <Field id="contact-email" label="מייל" error={fe.email} className="sm:col-span-2">
          <Input name="email" type="email" dir="ltr" defaultValue={contact?.email ?? ""} />
        </Field>
      </div>
      <Field id="contact-notes" label="הערות" error={fe.notes}>
        <Textarea name="notes" defaultValue={contact?.notes ?? ""} />
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

function DeleteContactButton({ contact }: { contact: ContactItem }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`מחיקת ${contact.name}`}
      disabled={pending}
      onClick={() => {
        if (!confirm(`למחוק את ${contact.name} מאנשי הקשר?`)) return;
        startTransition(async () => {
          const res = await deleteContact(contact.id);
          if (res.error) toast.error(res.error);
          else toast.success("איש הקשר נמחק");
        });
      }}
    >
      <Trash2Icon className="size-3.5" />
    </Button>
  );
}
