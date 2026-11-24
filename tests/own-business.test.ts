import { describe, expect, it } from "vitest";

import { clientLabel, OWN_BUSINESS_LABEL } from "@/features/shared/labels";
import { taskFiltersSchema } from "@/features/tasks/schemas";

describe("העסק שלי", () => {
  it("שיווק ועסקיות בלי לקוח מוצגות כ'העסק שלי', ושם לקוח גובר", () => {
    expect(clientLabel("marketing", null)).toBe(OWN_BUSINESS_LABEL);
    expect(clientLabel("business", undefined)).toBe(OWN_BUSINESS_LABEL);
    expect(clientLabel("marketing", "בית חב\"ד רמות")).toBe("בית חב\"ד רמות");
    expect(clientLabel("personal", null)).toBeNull();
    expect(clientLabel("clients", null)).toBeNull();
  });

  it("הסינון מקבל 'self' או מזהה לקוח, ומתעלם מכל ערך אחר", () => {
    expect(taskFiltersSchema.parse({ client: "self" }).client).toBe("self");
    const id = "11111111-1111-4111-8111-111111111111";
    expect(taskFiltersSchema.parse({ client: id }).client).toBe(id);
    expect(taskFiltersSchema.parse({ client: "me" }).client).toBeUndefined();
  });
});
