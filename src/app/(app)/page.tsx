import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// מסך "היום שלי" — ייבנה בפיצ'ר 8. בינתיים קיצורי דרך.
export default function TodayPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">היום שלי</h1>
      <Card>
        <CardHeader>
          <CardTitle>בקרוב</CardTitle>
          <CardDescription>כאן יוצגו השעון, פגישות היום ומשימות להיום.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          <Link href="/tasks" className="text-primary underline underline-offset-4">
            למשימות
          </Link>
          <Link href="/clients" className="text-primary underline underline-offset-4">
            ללקוחות
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
