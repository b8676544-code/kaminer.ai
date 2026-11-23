import { randomBytes, timingSafeEqual } from "node:crypto";

// הגנת CSRF בזרימת OAuth: ערך אקראי נשמר ב-cookie ונשלח ל-Google כ-state.
// ב-callback הערך שחזר חייב להיות זהה ל-cookie.
export const OAUTH_STATE_COOKIE = "google_oauth_state";

export function createOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function isValidOAuthState(cookieValue: string | null | undefined, queryValue: string | null | undefined) {
  if (!cookieValue || !queryValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(queryValue);
  return a.length === b.length && timingSafeEqual(a, b);
}
