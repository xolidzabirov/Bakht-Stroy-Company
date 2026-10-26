"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { User } from "lucide-react";
import { USER_COOKIE } from "@/shared/config/auth";
import { routes } from "@/shared/config/site";

function readName(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${USER_COOKIE}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : null;
}

// Cookies have no change event: re-read when the tab gets focus (login/logout in another tab).
const subscribe = (onChange: () => void) => {
  window.addEventListener("focus", onChange);
  return () => window.removeEventListener("focus", onChange);
};

/**
 * "Войти" for guests, the first name for signed-in users. Pages stay cached: the name comes from
 * a readable cookie, the token itself stays httpOnly.
 */
export function AccountAction() {
  const name = useSyncExternalStore(subscribe, readName, () => null);

  return (
    <Link
      href={name ? routes.account : routes.login}
      aria-label={name ? `Личный кабинет: ${name}` : "Войти"}
      className="flex min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-foreground transition hover:bg-surface-muted md:min-w-16"
    >
      <span className="relative">
        <User className="size-[22px]" />
        {name && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-success" />}
      </span>
      <span className="hidden max-w-20 truncate text-[11px] font-medium text-muted lg:block">{name ?? "Войти"}</span>
    </Link>
  );
}
