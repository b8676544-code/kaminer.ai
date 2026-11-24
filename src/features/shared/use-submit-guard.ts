"use client";

import { useEffect, useRef, type FormEvent } from "react";

// QA-11: חוסם שליחה שנייה של טופס לפני שהראשונה הסתיימה (שתי שליחות באותו רגע, לפני ש-pending מתעדכן).
// מחזיר onSubmit לטופס. preventDefault מונע מ-React להפעיל את ה-action שוב.
export function useSubmitGuard(pending: boolean) {
  const busy = useRef(false);
  useEffect(() => {
    if (!pending) busy.current = false;
  }, [pending]);
  return (e: FormEvent<HTMLFormElement>) => {
    if (busy.current) {
      e.preventDefault();
      return;
    }
    busy.current = true;
  };
}
