import { AlertTriangleIcon, CalendarCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, isoToJerusalem } from "@/features/shared/format";
import { getCurrentUser } from "@/lib/auth";
import { DisconnectButton, SelectCalendarForm } from "./google-forms";
import { getGoogleConnection, googleConfigured, listGoogleCalendars } from "./queries";
import { SyncNowButton } from "./sync-now-button";

const RESULT_MESSAGES: Record<string, { text: string; error?: boolean }> = {
  connected: { text: "החשבון חובר. נשאר לבחור יומן." },
  denied: { text: "החיבור בוטל במסך של Google.", error: true },
  invalid_state: { text: "החיבור נכשל בבדיקת אבטחה. אפשר לנסות שוב.", error: true },
  no_refresh_token: { text: "Google לא החזיר הרשאה קבועה. אפשר לנסות שוב.", error: true },
  not_configured: { text: "חסרים משתני הסביבה של Google ב-.env.", error: true },
  error: { text: "החיבור ל-Google נכשל. אפשר לנסות שוב.", error: true },
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return `${formatDate(iso)} ${isoToJerusalem(iso).time}`;
}

export async function GoogleSettingsCard({ result }: { result?: string }) {
  const [user, connection] = await Promise.all([getCurrentUser(), getGoogleConnection()]);
  const configured = googleConfigured();
  const message = result ? RESULT_MESSAGES[result] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheckIcon className="size-5" aria-hidden />
          Google Calendar
        </CardTitle>
        <CardDescription>
          סנכרון דו־כיווני של פגישות. שיוך ללקוח ולמשימה נשמר רק במערכת ולא נשלח ל-Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {message && (
          <p role={message.error ? "alert" : "status"} className={message.error ? "text-destructive text-sm" : "text-sm"}>
            {message.text}
          </p>
        )}

        {!connection ? (
          <div className="grid gap-2">
            {configured ? (
              <div>
                {/* ניווט מלא (לא Link): ה-route מפנה לדומיין של Google */}
                <Button asChild>
                  <a href="/api/google/oauth">חבר את Google Calendar</a>
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Button disabled>חבר את Google Calendar</Button>
                </div>
                <p className="text-muted-foreground text-sm">
                  כדי לחבר, יש למלא ב-.env את GOOGLE_CLIENT_ID, ‏GOOGLE_CLIENT_SECRET ו-GOOGLE_TOKEN_ENCRYPTION_KEY
                  ולהפעיל מחדש את שרת הפיתוח.
                </p>
              </>
            )}
          </div>
        ) : !connection.calendar_selected_at ? (
          <CalendarPicker userId={user.id} email={connection.google_email} />
        ) : (
          <div className="grid gap-3">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">חשבון</dt>
              <dd>{connection.google_email ?? "—"}</dd>
              <dt className="text-muted-foreground">יומן</dt>
              <dd>{connection.calendar_name ?? connection.calendar_id}</dd>
              <dt className="text-muted-foreground">סנכרון אחרון</dt>
              <dd>{formatDateTime(connection.last_synced_at)}</dd>
            </dl>
            {connection.last_sync_error && <SyncErrorBanner error={connection.last_sync_error} />}
            <div className="flex flex-wrap gap-2">
              <SyncNowButton />
              <DisconnectButton />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function CalendarPicker({ userId, email }: { userId: string; email: string | null }) {
  const res = await listGoogleCalendars(userId);
  return (
    <div className="grid gap-3">
      <p className="text-sm">מחובר לחשבון {email ?? "Google"}.</p>
      {"error" in res ? (
        <SyncErrorBanner error={res.error} />
      ) : res.calendars.length === 0 ? (
        <p className="text-sm">לא נמצאו יומנים עם הרשאת כתיבה בחשבון.</p>
      ) : (
        <SelectCalendarForm calendars={res.calendars} />
      )}
      <div>
        <DisconnectButton />
      </div>
    </div>
  );
}

export function SyncErrorBanner({ error }: { error: string }) {
  return (
    <div role="alert" className="border-destructive/40 bg-destructive/5 flex items-start gap-2 rounded-md border p-3 text-sm">
      <AlertTriangleIcon className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{error}</span>
    </div>
  );
}
