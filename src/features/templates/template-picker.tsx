"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/features/shared/field";
import { CATEGORY_LABELS, TASK_CATEGORIES, type TaskCategory } from "@/features/shared/labels";

type TemplateOption = { id: string; title: string; category: TaskCategory };

// בחירת תבנית בראש טופס "משימה חדשה". הבחירה נשמרת ב-?template=,
// והשרת ממלא את הטופס מחדש. שאר הפרמטרים (למשל ?client=) נשמרים.
export function TemplatePicker({ templates, selected }: { templates: TemplateOption[]; selected: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (templates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        אין עדיין תבניות.{" "}
        <Link href="/catalog" className="underline">
          לקטלוג
        </Link>
      </p>
    );
  }

  return (
    <Field id="template" label="מתבנית" className="max-w-2xl">
      <NativeSelect
        value={selected ?? ""}
        disabled={pending}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) params.set("template", e.target.value);
          else params.delete("template");
          const qs = params.toString();
          startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
        }}
      >
        <option value="">משימה ייחודית (בלי תבנית)</option>
        {TASK_CATEGORIES.map((category) => {
          const group = templates.filter((t) => t.category === category);
          if (group.length === 0) return null;
          return (
            <optgroup key={category} label={CATEGORY_LABELS[category]}>
              {group.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </optgroup>
          );
        })}
      </NativeSelect>
    </Field>
  );
}
