"use client";

import { useTransition } from "react";
import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setClientStatus } from "./actions";

export function ArchiveButton({ id, status }: { id: string; status: "active" | "archived" }) {
  const [pending, startTransition] = useTransition();
  const archiving = status === "active";

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (archiving && !confirm("להעביר את הלקוח לארכיון? אפשר להחזיר אותו בכל זמן.")) return;
        startTransition(async () => {
          const res = await setClientStatus(id, archiving ? "archived" : "active");
          if (res.error) toast.error(res.error);
          else toast.success(archiving ? "הלקוח הועבר לארכיון" : "הלקוח הוחזר לפעילים");
        });
      }}
    >
      {archiving ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
      {archiving ? "העברה לארכיון" : "החזרה לפעילים"}
    </Button>
  );
}
