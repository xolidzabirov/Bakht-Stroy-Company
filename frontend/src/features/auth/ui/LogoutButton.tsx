"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { disconnectRealtime } from "@/shared/lib/realtime";
import { useI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";

export function LogoutButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      await bff("/api/auth/logout").catch(() => null);
      disconnectRealtime();
      router.replace(routes.home);
      router.refresh();
    });

  return (
    <Button type="button" variant="outline" onClick={logout} disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {t.auth.logout}
    </Button>
  );
}
