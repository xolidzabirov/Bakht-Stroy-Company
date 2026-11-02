"use client";

import Link from "next/link";
import { Boxes, ChevronDown, Newspaper, Plus, UserPlus } from "lucide-react";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { buttonClasses } from "@/shared/ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu";

/** "+ Создать" in the top bar: a new product or post from any page (and a user for administrators). */
export function QuickCreate({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useI18n();
  const c = t.admin.create;
  const items = [
    { href: routes.adminProductNew, label: c.product, icon: Boxes },
    { href: routes.adminNewsNew, label: c.news, icon: Newspaper },
    ...(isAdmin ? [{ href: routes.adminUsers, label: c.user, icon: UserPlus }] : []),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonClasses({ size: "sm", className: "gap-1.5" })}>
        <Plus className="size-4" />
        <span className="hidden sm:inline">{c.title}</span>
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-xl p-1.5">
        {items.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild className="cursor-pointer gap-3 rounded-lg px-2.5 py-2 font-medium">
            <Link href={href}>
              <span className="grid size-7 place-items-center rounded-md bg-muted">
                <Icon className="size-4" />
              </span>
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
