"use client";

import { useActionState, useTransition } from "react";
import { UnlinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { ActionState } from "@/features/shared/form";
import type { CalendarOption } from "@/lib/google/calendar";
import { disconnectGoogle, selectCalendar } from "./actions";

export function SelectCalendarForm({ calendars }: { calendars: CalendarOption[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(selectCalendar, {});
  return (
    <form action={action} className="grid max-w-md gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="calendar_id">יומן לסנכרון</Label>
        <NativeSelect id="calendar_id" name="calendar_id" defaultValue={calendars.find((c) => c.primary)?.id}>
          {calendars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.primary ? `${c.name} (ראשי)` : c.name}
            </option>
          ))}
        </NativeSelect>
        <p className="text-muted-foreground text-xs">
          אחרי הבחירה היומן ננעל. כדי לעבור ליומן אחר מנתקים ומתחברים מחדש. פגישות עתידיות שכבר נמצאות במערכת יישלחו
          ליומן הזה.
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "מסנכרן לראשונה…" : "שמירה וסנכרון"}
        </Button>
      </div>
    </form>
  );
}

export function DisconnectButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("לנתק את Google Calendar? הפגישות יישארו במערכת, אבל יפסיקו להתעדכן.")) return;
        startTransition(async () => {
          const res = await disconnectGoogle();
          if (res.error) toast.error(res.error);
          else toast.success("Google Calendar נותק");
        });
      }}
    >
      <UnlinkIcon />
      ניתוק
    </Button>
  );
}
