"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { useSessionName } from "@/shared/lib/useSession";

/**
 * "Войти" for guests, the first name for signed-in users. Pages stay cached: the name comes from
 * a readable cookie, the token itself stays httpOnly.
 */
export function AccountAction() {
  const { t } = useI18n();
  const name = useSessionName();

  return (
    <Link
      href={name ? routes.account : routes.login}
      aria-label={name ? fmt(t.header.accountOf, { name }) : t.header.login}
      className="flex min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-foreground transition hover:bg-surface-muted md:min-w-16"
    >
      <span className="relative">
        <User className="size-[22px]" />
        {name && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-success" />}
      </span>
      <span className="hidden max-w-20 truncate text-[11px] font-medium text-muted-foreground lg:block">{name ?? t.header.login}</span>
    </Link>
  );
}
