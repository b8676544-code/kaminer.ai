import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/lib/auth";

// קורא את הסשן, ולכן חייב לשבת בתוך <Suspense>
export async function UserMenu() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground hidden text-sm sm:inline">{user.fullName ?? user.email}</span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" aria-label="התנתקות" title="התנתקות">
          <LogOutIcon />
        </Button>
      </form>
    </div>
  );
}
