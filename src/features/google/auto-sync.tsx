"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 5 * 60_000;

// סנכרון עם Google כשהמערכת פתוחה: בכניסה, כל 5 דקות כשהלשונית גלויה,
// וכשחוזרים ללשונית. בשרת יש throttle, כך שקריאות תכופות לא עולות כלום.
export function GoogleAutoSync() {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    let running = false;

    async function run() {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      try {
        const res = await fetch("/api/google/sync", { method: "POST" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string; changed?: number };
        if (!stopped && data.status === "ok" && data.changed) router.refresh();
      } catch {
        // רשת לא זמינה: ננסה בפעם הבאה
      } finally {
        running = false;
      }
    }

    run();
    const timer = setInterval(run, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
