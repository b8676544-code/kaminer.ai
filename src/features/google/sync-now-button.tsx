"use client";

import { useTransition } from "react";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncNow } from "./actions";

export function SyncNowButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size={size}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await syncNow();
          if (res.ok && res.error) toast.warning(res.error);
          else if (res.error) toast.error(res.error);
          else toast.success(res.changed ? `הסנכרון הסתיים: ${res.changed} שינויים` : "היומן מעודכן");
        })
      }
    >
      <RefreshCwIcon className={cn(pending && "animate-spin")} />
      {pending ? "מסנכרן…" : "סנכרן עכשיו"}
    </Button>
  );
}
