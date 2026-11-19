"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteTask } from "./actions";

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("למחוק את המשימה? תתי־המשימות, ההערות ורישומי הזמן שלה יימחקו גם הם. אי אפשר לבטל.")) return;
        startTransition(async () => {
          const res = await deleteTask(taskId);
          if (res?.error) toast.error(res.error);
        });
      }}
    >
      <Trash2Icon />
      מחיקה
    </Button>
  );
}
