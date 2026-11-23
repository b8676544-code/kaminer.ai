import { AlertTriangleIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/features/shared/pricing";
import type { ProjectBudget } from "./budget";

// כרטיס "תקציב" בדף הפרויקט: חלוקת המחיר למשימות, חיובים נפרדים ועלויות פרילנסרים
export function BudgetCard({ budget }: { budget: ProjectBudget }) {
  const rows: [string, string][] = [];
  if (budget.projectPrice != null) {
    rows.push(["מחיר הפרויקט", formatMoney(budget.projectPrice)]);
    rows.push(["חולק למשימות", formatMoney(budget.allocated)]);
    rows.push(["נשאר לחלק", formatMoney(budget.unallocated ?? 0)]);
  } else if (budget.allocated > 0) {
    rows.push(["חולק למשימות", formatMoney(budget.allocated)]);
  }
  if (budget.separateCharges > 0) {
    rows.push(["משימות במחיר נפרד", formatMoney(budget.separateCharges)]);
    rows.push(["סה״כ ללקוח", formatMoney(budget.totalToClient)]);
  }
  if (budget.freelancerInBudget > 0) {
    rows.push(["פרילנסרים מתוך התקציב", formatMoney(budget.freelancerInBudget)]);
    if (budget.remainingAfterFreelancers != null) {
      rows.push(["נשאר לך מהפרויקט", formatMoney(budget.remainingAfterFreelancers)]);
    }
  }
  if (budget.freelancerSeparate > 0) rows.push(["פרילנסרים כהוצאה נפרדת", formatMoney(budget.freelancerSeparate)]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">תקציב</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            אפשר לחלק את מחיר הפרויקט למשימות, או לתמחר משימה בנפרד, מתוך טופס המשימה.
          </p>
        ) : (
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd dir="ltr" className="text-end tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {budget.overAllocated && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
            חולק למשימות יותר ממחיר הפרויקט.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
