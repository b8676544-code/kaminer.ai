import { z } from "zod";

import { optionalNumber } from "./form";

// תמחור משותף לפרויקט ולמשימה: לפי שעה (תעריף × שעות בפועל, עם מחיר סופי שאפשר לתקן)
// או מחיר גלובלי (המחיר שסוכם הוא הסופי). תואם ל-CHECK ‏*_pricing_rules ב-DB.

export const pricingTypeSchema = z.enum(["hourly", "fixed"], "סוג תמחור לא תקין");
export type PricingType = z.infer<typeof pricingTypeSchema>;

export type Pricing = {
  pricing_type: PricingType | null;
  hourly_rate: number | null;
  final_price: number | null;
};

const money = (label: string) => optionalNumber(z.number("מספר לא תקין").min(0, `${label} לא יכול להיות שלילי`).max(99999999, "סכום גדול מדי"));

// שדות הטופס. "" בסוג = לא מתומחר
export const pricingFields = {
  pricing_type: z.preprocess((v) => (v === "" || v == null ? null : v), pricingTypeSchema.nullable()).default(null),
  hourly_rate: money("תעריף").default(null),
  final_price: money("מחיר").default(null),
};

// שגיאות לפני נרמול: במחיר גלובלי חובה מחיר
export function pricingRuleErrors(p: Pricing): Record<string, string> {
  if (p.pricing_type === "fixed" && p.final_price == null) {
    return { final_price: "במחיר גלובלי יש להזין את המחיר" };
  }
  return {};
}

// מנקה שדות שלא שייכים לסוג שנבחר (תעריף רק לפי שעה; בלי סוג אין מחיר)
export function normalizePricing(p: Pricing): Pricing {
  if (p.pricing_type === null) return { pricing_type: null, hourly_rate: null, final_price: null };
  return {
    pricing_type: p.pricing_type,
    hourly_rate: p.pricing_type === "hourly" ? p.hourly_rate : null,
    final_price: p.final_price,
  };
}

export const NO_PRICING: Pricing = { pricing_type: null, hourly_rate: null, final_price: null };

const round2 = (n: number) => Math.round(n * 100) / 100;

// computed: תעריף × שעות (רק לפי שעה). final: המחיר הסופי שהוזן, או המחושב אם עוד לא הוזן
export function computePrice(
  p: Pricing,
  billableMinutes: number,
): { computed: number | null; final: number | null; isFinalSet: boolean } {
  const computed =
    p.pricing_type === "hourly" && p.hourly_rate != null ? round2((p.hourly_rate * billableMinutes) / 60) : null;
  const isFinalSet = p.final_price != null;
  return { computed, final: isFinalSet ? Number(p.final_price) : computed, isFinalSet };
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  const n = Number(value);
  const text = Number.isInteger(n)
    ? n.toLocaleString("en-US")
    : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₪${text}`;
}

export const PRICING_LABELS: Record<PricingType, string> = { hourly: "לפי שעה", fixed: "מחיר גלובלי" };
