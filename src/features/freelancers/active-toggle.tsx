"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setFreelancerActive } from "./actions";

export function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setFreelancerActive(id, !isActive);
          if (res.error) toast.error(res.error);
        })
      }
    >
      {isActive ? "סימון כלא פעיל" : "הפעלה מחדש"}
    </Button>
  );
}
