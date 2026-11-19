"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addChecklistItem, deleteChecklistItem, toggleChecklistItem } from "./actions";

type Item = { id: string; text: string; is_done: boolean };

export function Checklist({ taskId, items }: { taskId: string; items: Item[] }) {
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state: Item[], change: { id: string; is_done?: boolean; deleted?: boolean }) =>
      change.deleted
        ? state.filter((i) => i.id !== change.id)
        : state.map((i) => (i.id === change.id ? { ...i, is_done: change.is_done ?? i.is_done } : i)),
  );
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const done = optimisticItems.filter((i) => i.is_done).length;

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-3">
      {optimisticItems.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {done} מתוך {optimisticItems.length} הושלמו
        </p>
      )}
      <ul className="grid gap-1">
        {optimisticItems.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <input
              id={`item-${item.id}`}
              type="checkbox"
              className="accent-primary size-4"
              checked={item.is_done}
              onChange={(e) => {
                const isDone = e.target.checked;
                run(async () => {
                  applyOptimistic({ id: item.id, is_done: isDone });
                  return toggleChecklistItem(taskId, item.id, isDone);
                });
              }}
            />
            <label
              htmlFor={`item-${item.id}`}
              className={item.is_done ? "text-muted-foreground flex-1 text-sm line-through" : "flex-1 text-sm"}
            >
              {item.text}
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`מחיקת "${item.text}"`}
              onClick={() =>
                run(async () => {
                  applyOptimistic({ id: item.id, deleted: true });
                  return deleteChecklistItem(taskId, item.id);
                })
              }
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = inputRef.current?.value.trim();
          if (!text) return;
          run(async () => {
            const res = await addChecklistItem(taskId, text);
            if (!res.error && inputRef.current) inputRef.current.value = "";
            return res;
          });
        }}
      >
        <Input ref={inputRef} placeholder="תת־משימה חדשה" aria-label="תת־משימה חדשה" maxLength={300} />
        <Button type="submit" variant="outline" size="icon" disabled={pending} aria-label="הוספה">
          <PlusIcon />
        </Button>
      </form>
    </div>
  );
}
