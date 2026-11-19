"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

type Props = { onNavigate?: () => void };

// usePathname הוא נתון של זמן ריצה, ולכן חייב <Suspense> (cacheComponents).
// עד שהוא זמין מוצגים אותם קישורים בלי סימון של הדף הנוכחי.
export function SidebarNav(props: Props) {
  return (
    <Suspense fallback={<NavLinks {...props} pathname={null} />}>
      <ActiveNavLinks {...props} />
    </Suspense>
  );
}

function ActiveNavLinks(props: Props) {
  const pathname = usePathname();
  return <NavLinks {...props} pathname={pathname} />;
}

function NavLinks({ onNavigate, pathname }: Props & { pathname: string | null }) {
  return (
    <nav aria-label="ניווט ראשי" className="grid gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, soon }) => {
        const active =
          pathname !== null &&
          (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="flex-1">{label}</span>
            {soon && (
              <span className="text-[10px] opacity-70">
                <span className="sr-only">, </span>בקרוב
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
