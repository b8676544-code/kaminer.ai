import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes } from "./format";
import { computePrice, formatMoney, PRICING_LABELS, type Pricing } from "./pricing";
import { LockPriceButton } from "./lock-price-button";

// כרטיס תמחור בדף פרויקט ובדף משימה
export function PricingCard({
  entity,
  entityId,
  pricing,
  billableMinutes,
}: {
  entity: "project" | "task";
  entityId: string;
  pricing: Pricing;
  billableMinutes: number;
}) {
  const { computed, final, isFinalSet } = computePrice(pricing, billableMinutes);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">תמחור</CardTitle>
      </CardHeader>
      <CardContent>
        {!pricing.pricing_type ? (
          <p className="text-muted-foreground text-sm">לא מתומחר. אפשר להגדיר בעריכה.</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">סוג</dt>
            <dd>{PRICING_LABELS[pricing.pricing_type]}</dd>
            {pricing.pricing_type === "hourly" && (
              <>
                <dt className="text-muted-foreground">תעריף</dt>
                <dd>{pricing.hourly_rate != null ? `${formatMoney(pricing.hourly_rate)} לשעה` : "—"}</dd>
              </>
            )}
            <dt className="text-muted-foreground">שעות לחיוב</dt>
            <dd>{formatMinutes(billableMinutes)}</dd>
            {pricing.pricing_type === "hourly" && (
              <>
                <dt className="text-muted-foreground">מחושב</dt>
                <dd>{formatMoney(computed)}</dd>
              </>
            )}
            <dt className="text-muted-foreground font-medium">מחיר סופי</dt>
            <dd className="font-semibold">
              {formatMoney(final)}
              {pricing.pricing_type === "hourly" && !isFinalSet && final != null && (
                <span className="text-muted-foreground font-normal"> (לפי החישוב, עוד לא נקבע)</span>
              )}
            </dd>
          </dl>
        )}
        {/* כפתור הקביעה: כשעוד לא נקבע מחיר, או כשהחישוב השתנה מאז שנקבע */}
        {pricing.pricing_type === "hourly" && computed != null && (!isFinalSet || computed !== final) && (
          <div className="mt-3">
            <LockPriceButton entity={entity} entityId={entityId} label={isFinalSet ? "עדכן לפי החישוב" : "קבע לפי החישוב"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
