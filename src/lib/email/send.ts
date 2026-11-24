import "server-only";

// שליחת מייל דרך Resend (REST). בלי RESEND_API_KEY או EMAIL_FROM: לא שולחים, ומחזירים false.
// צד שרת בלבד.

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(msg: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text }),
      cache: "no-store",
    });
    if (!res.ok) console.error("[email]", res.status);
    return res.ok;
  } catch (e) {
    console.error("[email]", e);
    return false;
  }
}
