import { HeaderTimer } from "./header-timer";
import { getRunningTimer } from "./queries";

// רכיב שרת: טוען את השעון הרץ ומעביר לכותרת. נטען בתוך <Suspense> ב-layout.
export async function HeaderTimerSlot() {
  const running = await getRunningTimer();
  return <HeaderTimer serverRunning={running} />;
}
