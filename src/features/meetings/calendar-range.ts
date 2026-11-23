import { isoToJerusalem, jerusalemToIso } from "@/features/shared/format";

// חישובי יומן טהורים. תאריכים הם "yyyy-mm-dd" בשעון ירושלים, השבוע מתחיל ביום ראשון.

export type CalendarView = "week" | "month";

// השדות שהפריסה צריכה. הרכיבים מעבירים אובייקט מלא יותר
export type CalendarMeeting = {
  id: string;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
};

const DAY_MINUTES = 24 * 60;

function toUtc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

// 0 = ראשון … 6 = שבת
export function dayOfWeek(date: string): number {
  return toUtc(date).getUTCDay();
}

export function weekStart(date: string): string {
  return addDays(date, -dayOfWeek(date));
}

export function weekDays(date: string): string[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// שבועות שלמים (ראשון–שבת) שמכסים את כל החודש של התאריך
export function monthGrid(date: string): string[][] {
  const first = `${date.slice(0, 7)}-01`;
  const nextMonth = shiftDate("month", first, 1);
  const weeks: string[][] = [];
  for (let day = weekStart(first); day < nextMonth; day = addDays(day, 7)) {
    weeks.push(weekDays(day));
  }
  return weeks;
}

// טווח השאילתה ל-DB: מתחילת היום הראשון עד תחילת היום שאחרי האחרון (לא כולל)
export function calendarRange(view: CalendarView, date: string): { from: string; to: string } {
  const days = view === "week" ? weekDays(date) : monthGrid(date).flat();
  return {
    from: jerusalemToIso(days[0], "00:00"),
    to: jerusalemToIso(addDays(days.at(-1)!, 1), "00:00"),
  };
}

// הקודם/הבא. בחודש קופצים ל-1 בחודש, כדי ש-31.1 לא יגלוש למרץ
export function shiftDate(view: CalendarView, date: string, direction: 1 | -1): string {
  if (view === "week") return addDays(date, 7 * direction);
  const d = toUtc(`${date.slice(0, 7)}-01`);
  d.setUTCMonth(d.getUTCMonth() + direction);
  return fromUtc(d);
}

// גבולות פגישה ביום מסוים, בדקות מחצות (0–1440). null = לא נוגעת ביום
function minutesOnDay(m: CalendarMeeting, day: string): { startMin: number; endMin: number } | null {
  const start = isoToJerusalem(m.starts_at);
  const end = isoToJerusalem(m.ends_at);
  if (start.date > day || end.date < day) return null;
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const startMin = start.date < day ? 0 : toMin(start.time);
  const endMin = end.date > day ? DAY_MINUTES : toMin(end.time);
  if (endMin <= startMin) return null; // מסתיימת בדיוק בחצות של תחילת היום
  return { startMin, endMin };
}

function touchesDay(m: CalendarMeeting, day: string): boolean {
  if (m.is_all_day) {
    // אירוע יום שלם: מחצות לחצות, ויום הסיום לא כלול
    return isoToJerusalem(m.starts_at).date <= day && day < isoToJerusalem(m.ends_at).date;
  }
  return minutesOnDay(m, day) !== null;
}

// כל הפגישות של יום (לתצוגת חודש): יום שלם קודם, אחר כך לפי שעת התחלה
export function meetingsOnDay<T extends CalendarMeeting>(meetings: T[], day: string): T[] {
  return meetings
    .filter((m) => touchesDay(m, day))
    .sort((a, b) => Number(b.is_all_day) - Number(a.is_all_day) || a.starts_at.localeCompare(b.starts_at));
}

export type DayBlock<T extends CalendarMeeting> = {
  meeting: T;
  startMin: number;
  endMin: number;
  // עמודה בתוך קבוצת פגישות חופפות, ומספר העמודות בקבוצה
  column: number;
  columns: number;
};

// פריסת פגישות עם שעות ביום אחד. פגישות חופפות מתחלקות לעמודות זו לצד זו
export function layoutDay<T extends CalendarMeeting>(meetings: T[], day: string): DayBlock<T>[] {
  const items = meetings
    .filter((m) => !m.is_all_day)
    .flatMap((m) => {
      const range = minutesOnDay(m, day);
      return range ? [{ meeting: m, ...range, column: 0, columns: 1 }] : [];
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const result: DayBlock<T>[] = [];
  let cluster: DayBlock<T>[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const b of cluster) b.columns = columnEnds.length;
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.startMin >= clusterEnd) closeCluster();
    let column = columnEnds.findIndex((end) => end <= item.startMin);
    if (column === -1) column = columnEnds.push(0) - 1;
    columnEnds[column] = item.endMin;
    item.column = column;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  closeCluster();
  return result;
}
