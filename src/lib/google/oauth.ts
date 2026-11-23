import "server-only";

// OAuth 2.0 מול Google, ישירות ב-REST (בלי ספרייה). צד שרת בלבד.
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];

// ה-refresh token בוטל או פג (invalid_grant): צריך להתחבר מחדש
export class GoogleAuthRevokedError extends Error {
  constructor() {
    super("החיבור ל-Google בוטל או פג. יש להתחבר מחדש בהגדרות.");
  }
}

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  );
}

export function googleRedirectUri(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/api/google/oauth/callback`;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    // מבטיח refresh token גם בחיבור חוזר
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...body,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    if (err.error === "invalid_grant") throw new GoogleAuthRevokedError();
    throw new Error(`Google token error ${res.status}: ${err.error ?? "unknown"}`);
  }
  return (await res.json()) as TokenResponse;
}

export function exchangeCode(code: string): Promise<TokenResponse> {
  return postToken({ code, grant_type: "authorization_code", redirect_uri: googleRedirectUri() });
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const data = await postToken({ refresh_token: refreshToken, grant_type: "refresh_token" });
  return data.access_token;
}

// ביטול ההרשאה ב-Google. כשל לא עוצר את הניתוק אצלנו
export async function revokeToken(token: string): Promise<void> {
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    cache: "no-store",
  }).catch(() => undefined);
}

// האימייל מתוך ה-id_token. הטוקן הגיע ישירות מ-Google ב-TLS בתשובה ל-code,
// ולכן לא צריך לאמת את החתימה (לפי התיעוד של Google ל-server-side flow).
export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")) as {
      email?: string;
    };
    return payload.email ?? null;
  } catch {
    return null;
  }
}
