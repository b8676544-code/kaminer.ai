import { Suspense } from "react";

import { GoogleSettingsCard } from "@/features/google/google-settings-card";

export const metadata = { title: "הגדרות — kaminer.ai" };

export default function Page({ searchParams }: PageProps<"/settings">) {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">הגדרות</h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">טוען…</p>}>
        <GoogleSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GoogleSection({ searchParams }: Pick<PageProps<"/settings">, "searchParams">) {
  const { google } = await searchParams;
  return <GoogleSettingsCard result={typeof google === "string" ? google : undefined} />;
}
