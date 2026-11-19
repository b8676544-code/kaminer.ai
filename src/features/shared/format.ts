const TZ = "Asia/Jerusalem";

// תאריך בפורמט ישראלי dd.mm.yyyy. מקבל "yyyy-mm-dd" (עמודת date) או timestamp.
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}.${m}.${y}`;
  }
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(value));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}

// דקות לתצוגה: 0:45, 2:05
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

// היום ב-Asia/Jerusalem בפורמט yyyy-mm-dd (להשוואה מול עמודת date)
export function todayInJerusalem(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// תחילת החודש הנוכחי ב-Asia/Jerusalem, yyyy-mm-01 (תואם ל-client_monthly_hours.month)
export function currentMonthStart(now: Date = new Date()): string {
  return `${todayInJerusalem(now).slice(0, 7)}-01`;
}

export function formatMonth(monthStart: string): string {
  const [y, m] = monthStart.split("-");
  return `${m}/${y}`;
}

export function isOverdue(dueDate: string | null, status: string, today: string): boolean {
  return Boolean(dueDate && status !== "done" && dueDate < today);
}
