"use client";

import { useTransition } from "react";
import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setTemplateActive } from "./actions";

export function ArchiveTemplateButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (isActive && !confirm("להעביר את התבנית לארכיון? משימות שנוצרו ממנה לא ישתנו, ואפשר להחזיר אותה בכל זמן.")) {
          return;
        }
        startTransition(async () => {
          const res = await setTemplateActive(id, !isActive);
          if (res.error) toast.error(res.error);
          else toast.success(isActive ? "התבנית הועברה לארכיון" : "התבנית הוחזרה לקטלוג");
        });
      }}
    >
      {isActive ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
      {isActive ? "ארכיון" : "החזרה"}
    </Button>
  );
}
