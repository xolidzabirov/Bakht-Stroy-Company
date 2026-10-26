"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { Button } from "@/shared/ui";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      await bff("/api/auth/logout").catch(() => null);
      router.replace(routes.home);
      router.refresh();
    });

  return (
    <Button type="button" variant="outline" onClick={logout} disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Выйти
    </Button>
  );
}
