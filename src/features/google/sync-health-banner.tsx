import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

import { ALERT_AFTER_FAILURES } from "@/lib/google/sync-health";
import { getGoogleConnection } from "./queries";

// פס אזהרה מעל התוכן כשהסנכרון עם Google נכשל 3 פעמים ברציפות. נעלם בסנכרון המוצלח הבא
export async function SyncHealthBanner() {
  const conn = await getGoogleConnection();
  if (!conn || (conn.consecutive_failures ?? 0) < ALERT_AFTER_FAILURES) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
      <span className="font-medium">הסנכרון עם Google Calendar נכשל {conn.consecutive_failures} פעמים ברציפות.</span>
      {conn.last_sync_error && <span>{conn.last_sync_error}</span>}
      <Link href="/settings" className="font-medium underline underline-offset-2">
        לפרטים ולחיבור מחדש
      </Link>
    </div>
  );
}
