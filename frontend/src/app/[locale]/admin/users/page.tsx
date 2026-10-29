import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Users } from "lucide-react";
import { ResetFilters, SearchFilter, SelectFilter } from "@/features/admin-filters/ui/Filters";
import { CreateUserDialog } from "@/features/admin-users/ui/CreateUserDialog";
import { requireAdmin } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminUser, Paginated } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatMoney, formatPhone } from "@/shared/lib/format";
import { Pagination } from "@/shared/ui/Pagination";
import { EmptyState, PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.users.title };
}

type Search = Partial<Record<"search" | "role" | "blocked" | "sort" | "page", string>>;

const roleTone: Record<string, string> = {
  admin: "bg-ink text-brand dark:bg-white dark:text-ink",
  manager: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  client: "bg-muted text-muted-foreground",
};

/** Registered people (administrator only): search, role, blocked, sort by purchases. */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin(routes.adminUsers);
  const search = await searchParams;
  const query = new URLSearchParams({ per_page: "20" });
  (["search", "role", "blocked", "sort", "page"] as const).forEach((key) => search[key] && query.set(key, search[key]!));

  const [{ t, locale }, users] = await Promise.all([getI18n(), userFetch<Paginated<AdminUser>>(`/admin/users?${query}`)]);
  const u = t.admin.users;
  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    next.delete("per_page");
    return `${routes.adminUsers}?${next}`;
  };
  const roleOf = (user: AdminUser) => (user.roles?.includes("admin") ? "admin" : user.roles?.includes("manager") ? "manager" : "client");

  return (
    <div>
      <PageHeader title={u.title} description={fmt(t.admin.common.total, { count: String(users.meta.total) })} actions={<CreateUserDialog />} />

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchFilter placeholder={u.searchPlaceholder} />
        <SelectFilter name="role" label={u.role} options={Object.entries(u.roles).map(([value, label]) => ({ value, label }))} />
        <SelectFilter
          name="blocked"
          label={u.state}
          options={[
            { value: "0", label: u.states.active },
            { value: "1", label: u.states.blocked },
          ]}
        />
        <SelectFilter name="sort" label={u.sort} allLabel={u.sorts.new} options={Object.entries(u.sorts).filter(([value]) => value !== "new").map(([value, label]) => ({ value, label }))} />
        <ResetFilters />
      </div>

      {users.data.length === 0 ? (
        <EmptyState icon={Users} title={t.admin.common.empty} text={t.admin.common.emptyText} />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            <li className="hidden grid-cols-[1.4fr_1.2fr_8rem_9rem_7rem] gap-3 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
              <span>{u.user}</span>
              <span>{u.contacts}</span>
              <span>{u.role}</span>
              <span className="text-right">{u.orders}</span>
              <span className="text-right">{u.registered}</span>
            </li>
            {users.data.map((user) => {
              const role = roleOf(user);
              return (
                <li key={user.id}>
                  <Link href={routes.adminUser(user.id)} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition hover:bg-muted/40 lg:grid-cols-[1.4fr_1.2fr_8rem_9rem_7rem]">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-brand">{user.name.charAt(0)}</span>
                      <span className="min-w-0">
                        <b className="flex items-center gap-1.5 truncate text-sm">
                          {user.name}
                          {user.is_blocked && <Ban className="size-3.5 shrink-0 text-destructive" aria-label={u.blocked} />}
                        </b>
                        <span className="block truncate text-xs text-muted-foreground lg:hidden">{user.phone ? formatPhone(user.phone) : user.email}</span>
                      </span>
                    </span>
                    <span className="hidden min-w-0 text-sm lg:block">
                      <span className="block truncate">{user.email}</span>
                      <span className="block text-xs text-muted-foreground">{user.phone ? formatPhone(user.phone) : "—"}</span>
                    </span>
                    <span>
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", roleTone[role])}>{u.roles[role]}</span>
                    </span>
                    <span className="hidden text-right text-sm lg:block">
                      <b className="tabular-nums">{user.orders_count}</b>
                      <span className="block text-xs text-muted-foreground">{formatMoney(user.orders_total, locale)}</span>
                    </span>
                    <span className="hidden text-right text-xs text-muted-foreground lg:block">{formatDate(user.created_at, locale)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Pagination page={users.meta.current_page} lastPage={users.meta.last_page} href={pageHref} />
        </>
      )}
    </div>
  );
}
