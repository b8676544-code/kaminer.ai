import { computePrice, type Pricing } from "@/features/shared/pricing";

// תקציב פרויקט: איך המחיר הכללי מתחלק בין המשימות, מה הלקוח משלם בנוסף, ומה נשאר אחרי פרילנסרים. טהור.

export type BudgetTask = Pricing & {
  project_share: number | null;
  billed_separately: boolean;
  assignee_freelancer_id: string | null;
  freelancer_cost: number | null;
  freelancer_cost_in_project: boolean;
  billableMinutes: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function projectBudget(project: Pricing & { billableMinutes: number }, tasks: BudgetTask[]) {
  const projectPrice = computePrice(project, project.billableMinutes).final;

  let allocated = 0;
  let separateCharges = 0;
  let freelancerInBudget = 0;
  let freelancerSeparate = 0;
  for (const t of tasks) {
    if (t.billed_separately) separateCharges += computePrice(t, t.billableMinutes).final ?? 0;
    else allocated += Number(t.project_share ?? 0);
    if (t.assignee_freelancer_id && t.freelancer_cost != null) {
      if (t.freelancer_cost_in_project) freelancerInBudget += Number(t.freelancer_cost);
      else freelancerSeparate += Number(t.freelancer_cost);
    }
  }

  return {
    projectPrice,
    allocated: round2(allocated),
    // null כשלפרויקט אין מחיר (לא מתומחר, או לפי שעה בלי תעריף)
    unallocated: projectPrice == null ? null : round2(projectPrice - allocated),
    overAllocated: projectPrice != null && allocated > projectPrice,
    separateCharges: round2(separateCharges),
    totalToClient: round2((projectPrice ?? 0) + separateCharges),
    freelancerInBudget: round2(freelancerInBudget),
    freelancerSeparate: round2(freelancerSeparate),
    // מה נשאר מהמחיר הכללי אחרי עלויות הפרילנסרים שיורדות ממנו
    remainingAfterFreelancers: projectPrice == null ? null : round2(projectPrice - freelancerInBudget),
  };
}

export type ProjectBudget = ReturnType<typeof projectBudget>;
