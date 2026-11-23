import { Suspense } from "react";
import Link from "next/link";
import { ListChecksIcon, PencilIcon, PlusIcon, TimerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/features/shared/format";
import { CATEGORY_LABELS, TASK_CATEGORIES, type TaskCategory } from "@/features/shared/labels";
import { CategoryBadge } from "@/features/tasks/badges";
import { ArchiveTemplateButton } from "@/features/templates/archive-template-button";
import { listTemplates } from "@/features/templates/queries";
import { templateFiltersSchema } from "@/features/templates/schemas";
import { TemplateFormDialog } from "@/features/templates/template-form-dialog";
import { cn } from "@/lib/utils";

export const metadata = { title: "קטלוג — kaminer.ai" };

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">קטלוג משימות</h1>
        <TemplateFormDialog
          trigger={
            <Button size="sm" className="ms-auto">
              <PlusIcon />
              תבנית חדשה
            </Button>
          }
        />
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען תבניות…</p>}>
        <TemplatesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function catalogHref(category: TaskCategory | undefined, archived: boolean) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (archived) params.set("archived", "1");
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

const tabClass = (active: boolean) =>
  cn("rounded-md px-3 py-1", active ? "bg-background font-medium shadow-sm" : "text-muted-foreground");

async function TemplatesList({ searchParams }: Pick<PageProps<"/catalog">, "searchParams">) {
  const { category, archived } = templateFiltersSchema.parse(await searchParams);
  const templates = await listTemplates({ category, archived });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="סינון לפי קטגוריה" className="bg-muted inline-flex flex-wrap rounded-lg p-1 text-sm">
          <Link href={catalogHref(undefined, archived)} aria-current={!category ? "page" : undefined} className={tabClass(!category)}>
            הכול
          </Link>
          {TASK_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={catalogHref(c, archived)}
              aria-current={category === c ? "page" : undefined}
              className={tabClass(category === c)}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </nav>
        <nav aria-label="תבניות פעילות או בארכיון" className="bg-muted inline-flex rounded-lg p-1 text-sm">
          <Link href={catalogHref(category, false)} aria-current={!archived ? "page" : undefined} className={tabClass(!archived)}>
            פעילות
          </Link>
          <Link href={catalogHref(category, true)} aria-current={archived ? "page" : undefined} className={tabClass(archived)}>
            ארכיון
          </Link>
        </nav>
      </div>

      {templates.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {archived
            ? "אין תבניות בארכיון."
            : "אין עדיין תבניות כאן. אפשר להוסיף תבנית בכפתור למעלה, או לשמור משימה קיימת כתבנית מדף המשימה."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id} className={cn("bg-card flex flex-col gap-3 rounded-lg border p-4", !t.is_active && "opacity-75")}>
              <div className="flex items-start gap-2">
                <h2 className="flex-1 font-semibold leading-snug">{t.title}</h2>
                <CategoryBadge category={t.category} />
              </div>
              {t.description && <p className="text-muted-foreground line-clamp-2 text-sm">{t.description}</p>}
              <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                <span className="inline-flex items-center gap-1">
                  <TimerIcon className="size-3.5" aria-hidden />
                  {t.default_estimate_minutes ? formatMinutes(t.default_estimate_minutes) : "בלי הערכה"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ListChecksIcon className="size-3.5" aria-hidden />
                  {t.checklist.length} תתי־משימות
                </span>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
                {t.is_active && (
                  <Button asChild size="sm">
                    <Link href={`/tasks/new?template=${t.id}`}>
                      <PlusIcon />
                      צור משימה
                    </Link>
                  </Button>
                )}
                <TemplateFormDialog
                  template={t}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <PencilIcon />
                      עריכה
                    </Button>
                  }
                />
                <ArchiveTemplateButton id={t.id} isActive={t.is_active} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
