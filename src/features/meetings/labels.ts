import { isoToJerusalem } from "@/features/shared/format";
import { dayOfWeek, type CalendarView } from "./calendar-range";

export const WEEKDAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const;

// "23.11" מתוך "2026-11-23"
export function dayMonth(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

export function weekdayLabel(date: string): string {
  return WEEKDAY_SHORT[dayOfWeek(date)];
}

// "10:00" בשעון ירושלים
export function timeOf(iso: string): string {
  return isoToJerusalem(iso).time;
}

export function timeRange(startsAt: string, endsAt: string): string {
  return `${timeOf(startsAt)}–${timeOf(endsAt)}`;
}

// דקות מחצות ל-"HH:MM"
export function minutesToTime(minutes: number): string {
  const m = Math.min(Math.max(minutes, 0), 24 * 60 - 1);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const monthFormatter = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });

// כותרת הטווח בסרגל: "22.11 – 28.11.2026" או "נובמבר 2026"
export function rangeTitle(view: CalendarView, days: string[]): string {
  if (view === "month") {
    const mid = days[Math.floor(days.length / 2)];
    return monthFormatter.format(new Date(`${mid}T00:00:00Z`));
  }
  const first = days[0];
  const last = days.at(-1)!;
  return `${dayMonth(first)} – ${dayMonth(last)}.${last.slice(0, 4)}`;
}

export function calendarHref(view: CalendarView, date: string): string {
  return `/calendar?view=${view}&date=${date}`;
}
