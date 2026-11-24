"use client";

import { useId, useOptimistic, useTransition } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { formatDate, isOverdue } from "@/features/shared/format";
import { clientLabel, STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/features/shared/labels";
import { cn } from "@/lib/utils";
import { setTaskStatus } from "./actions";
import { CategoryBadge, PriorityBadge } from "./badges";
import type { TaskListItem } from "./queries";

const COLUMN_TONE: Record<TaskStatus, string> = {
  todo: "border-t-slate-400",
  in_progress: "border-t-blue-500",
  waiting_client: "border-t-amber-500",
  done: "border-t-emerald-500",
};

export function KanbanBoard({ tasks, today }: { tasks: TaskListItem[]; today: string }) {
  const [optimisticTasks, moveTask] = useOptimistic(tasks, (state, move: { id: string; status: TaskStatus }) =>
    state.map((t) => (t.id === move.id ? { ...t, status: move.status } : t)),
  );
  const [, startTransition] = useTransition();
  // id יציב, כדי שה-aria-describedby יתאים בין השרת לדפדפן (hydration)
  const dndId = useId();
  const sensors = useSensors(
    // מרחק מינימלי כדי שלחיצה על קישור לא תתחיל גרירה
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const titleOf = (id: string | number) => optimisticTasks.find((t) => t.id === id)?.title ?? "משימה";
  const columnOf = (id: string | number | undefined) =>
    id && id in STATUS_LABELS ? STATUS_LABELS[id as TaskStatus] : "";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `הרמת את "${titleOf(active.id)}"`,
    onDragOver: ({ active, over }) => (over ? `"${titleOf(active.id)}" מעל העמודה ${columnOf(over.id)}` : ""),
    onDragEnd: ({ active, over }) =>
      over ? `"${titleOf(active.id)}" הועברה ל${columnOf(over.id)}` : `"${titleOf(active.id)}" הוחזרה למקומה`,
    onDragCancel: ({ active }) => `הגרירה בוטלה. "${titleOf(active.id)}" הוחזרה למקומה`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const status = over.id as TaskStatus;
    const task = optimisticTasks.find((t) => t.id === active.id);
    if (!task || task.status === status) return;

    startTransition(async () => {
      moveTask({ id: task.id, status });
      const res = await setTaskStatus(task.id, status);
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <DndContext
      id={dndId}
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "כדי להזיז משימה: רווח להרמה, חיצים להזזה בין עמודות, רווח להנחה, Escape לביטול.",
        },
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={optimisticTasks.filter((t) => t.status === status)}
            today={today}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ status, tasks, today }: { status: TaskStatus; tasks: TaskListItem[]; today: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABELS[status]}
      className={cn(
        "bg-muted/40 flex min-h-40 flex-col gap-2 rounded-lg border border-t-4 p-2 transition-colors",
        COLUMN_TONE[status],
        isOver && "bg-accent",
      )}
    >
      <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
        {STATUS_LABELS[status]}
        <span className="text-muted-foreground font-normal">{tasks.length}</span>
      </h2>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} today={today} />
      ))}
    </section>
  );
}

function TaskCard({ task, today }: { task: TaskListItem; today: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const overdue = isOverdue(task.due_date, task.status, today);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      aria-roledescription="כרטיס משימה"
      className={cn(
        "bg-background grid cursor-grab gap-1.5 rounded-md border p-3 text-sm shadow-xs touch-manipulation select-none focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
        isDragging && "z-10 cursor-grabbing opacity-80 shadow-lg",
      )}
    >
      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
        {task.title}
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={task.category} />
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{clientLabel(task.category, task.clients?.name) ?? task.freelancers?.full_name ?? ""}</span>
        {task.due_date && (
          <span className={cn(overdue && "text-destructive font-medium")}>{formatDate(task.due_date)}</span>
        )}
      </div>
    </article>
  );
}
