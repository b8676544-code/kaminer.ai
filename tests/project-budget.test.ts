import { describe, expect, it } from "vitest";

import { projectBudget, type BudgetTask } from "@/features/projects/budget";
import { taskSchema } from "@/features/tasks/schemas";

const CLIENT = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const PROJECT = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const FREELANCER = "9b2f3c1a-1d2e-4f5a-8b6c-7d8e9f0a1b2c";

const t = (over: Partial<BudgetTask>): BudgetTask => ({
  pricing_type: null,
  hourly_rate: null,
  final_price: null,
  project_share: null,
  billed_separately: false,
  assignee_freelancer_id: null,
  freelancer_cost: null,
  freelancer_cost_in_project: true,
  billableMinutes: 0,
  ...over,
});

const PROJECT_8000 = { pricing_type: "fixed" as const, hourly_rate: null, final_price: 8000, billableMinutes: 0 };

describe("תקציב פרויקט", () => {
  it("חלוקה, חיוב נפרד ופרילנסר מתוך התקציב", () => {
    const b = projectBudget(PROJECT_8000, [
      t({ project_share: 2000 }),
      t({ project_share: 1500, assignee_freelancer_id: FREELANCER, freelancer_cost: 900 }),
      t({ billed_separately: true, pricing_type: "fixed", final_price: 500 }),
      t({ assignee_freelancer_id: FREELANCER, freelancer_cost: 300, freelancer_cost_in_project: false }),
    ]);
    expect(b).toEqual({
      projectPrice: 8000,
      allocated: 3500,
      unallocated: 4500,
      overAllocated: false,
      separateCharges: 500,
      totalToClient: 8500,
      freelancerInBudget: 900,
      freelancerSeparate: 300,
      remainingAfterFreelancers: 7100,
    });
  });

  it("חריגה: חולק יותר מהמחיר", () => {
    const b = projectBudget(PROJECT_8000, [t({ project_share: 5000 }), t({ project_share: 4000 })]);
    expect(b.overAllocated).toBe(true);
    expect(b.unallocated).toBe(-1000);
  });

  it("חיוב נפרד לפי שעה מחושב מהשעות של המשימה", () => {
    const b = projectBudget(PROJECT_8000, [
      t({ billed_separately: true, pricing_type: "hourly", hourly_rate: 200, billableMinutes: 90 }),
    ]);
    expect(b.separateCharges).toBe(300);
  });

  it("פרויקט לא מתומחר: אין יתרה", () => {
    const b = projectBudget({ pricing_type: null, hourly_rate: null, final_price: null, billableMinutes: 0 }, []);
    expect(b.projectPrice).toBeNull();
    expect(b.unallocated).toBeNull();
  });
});

describe("משימה בפרויקט: כלולה או נפרדת", () => {
  const base = { title: "עיצוב דף הבית", category: "clients", client_id: CLIENT, project_id: PROJECT };

  it("כלולה: נשמר החלק, התמחור מתאפס", () => {
    const r = taskSchema.safeParse({ ...base, project_share: "2000", pricing_type: "fixed", final_price: "9" });
    expect(r.data).toMatchObject({ billed_separately: false, project_share: 2000, pricing_type: null, final_price: null });
  });

  it("נפרדת: נשמר התמחור, החלק מתאפס", () => {
    const r = taskSchema.safeParse({
      ...base,
      billed_separately: "true",
      project_share: "2000",
      pricing_type: "fixed",
      final_price: "500",
    });
    expect(r.data).toMatchObject({ billed_separately: true, project_share: null, pricing_type: "fixed", final_price: 500 });
  });

  it("נפרדת במחיר גלובלי בלי מחיר: שגיאה", () => {
    const r = taskSchema.safeParse({ ...base, billed_separately: "true", pricing_type: "fixed" });
    expect(r.success).toBe(false);
  });

  it("בלי פרויקט: אין חלק ואין נפרדת", () => {
    const r = taskSchema.safeParse({
      title: "x",
      category: "clients",
      client_id: CLIENT,
      billed_separately: "true",
      project_share: "100",
    });
    expect(r.data).toMatchObject({ billed_separately: false, project_share: null });
  });

  it("פרילנסר: הוצאה נפרדת נשמרת רק בפרויקט עם פרילנסר", () => {
    const r = taskSchema.safeParse({
      ...base,
      assignee_freelancer_id: FREELANCER,
      freelancer_cost: "900",
      freelancer_cost_in_project: "false",
    });
    expect(r.data?.freelancer_cost_in_project).toBe(false);
    const noFreelancer = taskSchema.safeParse({ ...base, freelancer_cost_in_project: "false" });
    expect(noFreelancer.data?.freelancer_cost_in_project).toBe(true);
  });
});
