"use client";

// QA-2: שגיאה במעטפת הראשית עצמה. מחליף את כל הדף, ולכן כולל html ו-body משלו
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div role="alert" style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>משהו השתבש</h1>
          <p style={{ color: "#666" }}>המערכת לא הצליחה להיטען. נסי שוב בעוד רגע.</p>
          <button type="button" onClick={reset} style={{ padding: "10px 20px", fontSize: 16, cursor: "pointer" }}>
            לנסות שוב
          </button>
        </div>
      </body>
    </html>
  );
}
