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

// זמן שעבר בשעון רץ: 0:04:09, 12:30:00
export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// חלקי תאריך ושעה של רגע נתון ב-Asia/Jerusalem
function jerusalemParts(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

// ההפרש בדקות בין שעון ירושלים ל-UTC ברגע נתון (120 או 180)
function jerusalemOffsetMinutes(instant: Date): number {
  const p = jerusalemParts(instant);
  const asUtc = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

// תאריך ("yyyy-mm-dd") ושעה ("HH:MM") בשעון ירושלים, לרגע ב-ISO (UTC).
// כולל מעבר שעון קיץ/חורף.
export function jerusalemToIso(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let result = wall - jerusalemOffsetMinutes(new Date(wall)) * 60000;
  const second = wall - jerusalemOffsetMinutes(new Date(result)) * 60000;
  if (second !== result) result = second;
  return new Date(result).toISOString();
}

// רגע (ISO) לתאריך ושעה בשעון ירושלים, לברירת מחדל בטפסים
export function isoToJerusalem(iso: string): { date: string; time: string } {
  const p = jerusalemParts(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
}
