import Link from "next/link";

import { Button } from "@/components/ui/button";

// QA-5: רשומה שלא קיימת או נמחקה (notFound() בדפי פרטים)
export default function AppNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">לא מצאנו את מה שחיפשת</h1>
      <p className="text-muted-foreground text-sm">ייתכן שהרשומה נמחקה או שהקישור שגוי.</p>
      <Button asChild>
        <Link href="/">חזרה להיום שלי</Link>
      </Button>
    </div>
  );
}
