"use client";

import { useTransition } from "react";
import { LockIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lockComputedPrice } from "@/features/projects/actions";

export function LockPriceButton({ entity, entityId, label }: { entity: "project" | "task"; entityId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await lockComputedPrice(entity, entityId);
          if (res.error) toast.error(res.error);
          else toast.success("המחיר הסופי נקבע לפי החישוב");
        })
      }
    >
      <LockIcon />
      {label}
    </Button>
  );
}
