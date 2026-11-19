import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "כניסה — kaminer.ai" };

const ERRORS: Record<string, string> = {
  link: "קישור הכניסה לא תקין או שפג תוקפו. אפשר לבקש קישור חדש.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">kaminer.ai</CardTitle>
          <CardDescription>כניסה למערכת ניהול המשימות</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoginForm />}>
            <LoginFormWithError searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function LoginFormWithError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const key = typeof error === "string" ? error : undefined;
  return <LoginForm initialError={key ? ERRORS[key] : undefined} />;
}
