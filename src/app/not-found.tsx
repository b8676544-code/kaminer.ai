import Link from "next/link";

import { Button } from "@/components/ui/button";

// QA-5: כתובת שלא קיימת במערכת
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">הדף לא נמצא</h1>
      <p className="text-muted-foreground text-sm">הכתובת לא קיימת במערכת.</p>
      <Button asChild>
        <Link href="/">חזרה לדף הבית</Link>
      </Button>
    </main>
  );
}
