"use client";

import { Button } from "@/components/ui/button";

// QA-2: שגיאה בזמן טעינת מסך. המעטפת (ניווט ושעון) נשארת, ורק התוכן מוחלף
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">משהו השתבש</h1>
      <p className="text-muted-foreground text-sm">לא הצלחנו לטעון את המסך. אפשר לנסות שוב, ואם זה חוזר כדאי לרענן את הדף.</p>
      <Button onClick={reset}>לנסות שוב</Button>
    </div>
  );
}
