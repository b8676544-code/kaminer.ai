import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// מסך "היום שלי" — שלד בלבד. התוכן ייבנה בפיצ'ר 8 (אחרי D1).
export default function TodayPage() {
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">היום שלי</CardTitle>
          <CardDescription>kaminer.ai — שלד האפליקציה מוכן</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          כאן יוצגו השעון, פגישות היום ומשימות להיום.
        </CardContent>
      </Card>
    </main>
  );
}
