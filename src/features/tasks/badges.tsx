import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
} from "@/features/shared/labels";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={STATUS_BADGE_CLASS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "normal") return null;
  return (
    <Badge variant="outline" className={PRIORITY_BADGE_CLASS[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function CategoryBadge({ category, className }: { category: TaskCategory; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("font-normal", className)}>
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}
