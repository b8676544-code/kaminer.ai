"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "./field";
import { PRICING_LABELS, type Pricing, type PricingType } from "./pricing";

// שדות התמחור בטופס פרויקט ובטופס משימה. התעריף ממולא מראש מהלקוח וניתן לשינוי.
export function PricingFields({
  idPrefix,
  values,
  defaultRate,
  errors,
}: {
  idPrefix: string;
  values: Pricing;
  defaultRate: number | null;
  errors: Record<string, string>;
}) {
  const [type, setType] = useState<PricingType | "">(values.pricing_type ?? "");

  return (
    <fieldset className="grid gap-4 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">תמחור</legend>
      <Field id={`${idPrefix}-pricing_type`} label="סוג תמחור" error={errors.pricing_type}>
        <NativeSelect name="pricing_type" value={type} onChange={(e) => setType(e.target.value as PricingType | "")}>
          <option value="">לא מתומחר</option>
          <option value="hourly">{PRICING_LABELS.hourly}</option>
          <option value="fixed">{PRICING_LABELS.fixed}</option>
        </NativeSelect>
      </Field>

      {type === "hourly" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${idPrefix}-hourly_rate`} label="תעריף לשעה (₪)" error={errors.hourly_rate}>
            <Input
              name="hourly_rate"
              type="number"
              min={0}
              step="0.01"
              dir="ltr"
              defaultValue={values.hourly_rate ?? defaultRate ?? ""}
            />
          </Field>
          <Field id={`${idPrefix}-final_price`} label="מחיר סופי (₪, אופציונלי)" error={errors.final_price}>
            <Input name="final_price" type="number" min={0} step="0.01" dir="ltr" defaultValue={values.final_price ?? ""} />
          </Field>
          <p className="text-muted-foreground text-xs sm:col-span-2">
            כל עוד אין מחיר סופי, מוצג המחיר המחושב: תעריף × שעות לחיוב. אפשר לקבע אותו ולתקן.
          </p>
        </div>
      )}

      {type === "fixed" && (
        <Field id={`${idPrefix}-final_price`} label="המחיר שסוכם (₪)" error={errors.final_price} required>
          <Input name="final_price" type="number" min={0} step="0.01" dir="ltr" defaultValue={values.final_price ?? ""} required />
        </Field>
      )}
    </fieldset>
  );
}
