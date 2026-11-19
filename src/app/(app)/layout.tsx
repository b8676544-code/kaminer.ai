import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon, TimerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      {/* סרגל צד: בצד ימין (תחילת השורה ב-RTL) */}
      <aside className="bg-muted/30 hidden w-56 shrink-0 border-e p-4 md:block">
        <Link href="/" className="mb-6 block px-3 text-lg font-bold">
          kaminer.ai
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/95 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <MobileNav />
          {/* מקום לשעון. ייבנה בפיצ'ר השעון */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm" aria-label="שעון">
            <TimerIcon className="size-4" aria-hidden />
            <span>אין שעון פעיל</span>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/tasks/new">
                <PlusIcon />
                משימה חדשה
              </Link>
            </Button>
            <Suspense fallback={<div className="size-9" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
