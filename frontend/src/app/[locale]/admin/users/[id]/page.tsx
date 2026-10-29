import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, BadgeCheck, CalendarDays, Mail, MapPin, Phone } from "lucide-react";
import { OrderStatusBadge, PaymentBadge } from "@/entities/order/ui/OrderStatus";
import { ChatWithCustomer } from "@/features/admin-orders/ui/OrderAdminActions";
import { UserAdminActions } from "@/features/admin-users/ui/UserAdminActions";
import { ApiError } from "@/shared/api/http";
import { requireAdmin } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Address, AdminUser, OrderSummary } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate, formatMoney, formatPhone } from "@/shared/lib/format";
import { PageHeader, Panel } from "@/widgets/admin-shell/ui/PageHeader";

type Details = AdminUser & { addresses: Address[]; recent_orders: OrderSummary[] };
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.users.user };
}

async function loadUser(id: number): Promise<Details> {
  try {
    return (await userFetch<{ data: Details }>(`/admin/users/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** A user card for the administrator: contacts, purchases, addresses, recent orders, role and blocking. */
export default async function AdminUserPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const me = await requireAdmin(routes.adminUser(id));
  const [{ t, locale }, user] = await Promise.all([getI18n(), loadUser(id)]);
  const u = t.admin.user;
  const role = user.roles?.includes("admin") ? "admin" : user.roles?.includes("manager") ? "manager" : "client";
  const phone = user.phone?.replace(/\D/g, "");

  return (
    <div>
      <PageHeader
        back={{ href: routes.adminUsers, label: u.back }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {user.name}
            {user.is_blocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-sm font-bold text-destructive">
                <Ban className="size-4" />
                {t.admin.users.blocked}
              </span>
            )}
          </span>
        }
        description={t.admin.users.roles[role]}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <dd className="text-2xl font-extrabold">{user.orders_count}</dd>
              <dt className="text-sm text-muted-foreground">{u.ordersCount}</dt>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <dd className="text-2xl font-extrabold">{formatMoney(user.orders_total, locale)}</dd>
              <dt className="text-sm text-muted-foreground">{u.ordersTotal}</dt>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <dd className="text-sm font-bold">{user.last_order_at ? formatDate(user.last_order_at, locale) : "—"}</dd>
              <dt className="text-sm text-muted-foreground">{user.last_order_at ? u.lastOrderLabel : u.noOrdersYet}</dt>
            </div>
          </dl>

          <Panel title={u.recentOrders}>
            {user.recent_orders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{u.noOrdersYet}</p>
            ) : (
              <ul className="divide-y divide-border">
                {user.recent_orders.map((order) => (
                  <li key={order.id}>
                    <Link href={routes.adminOrder(order.number)} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm hover:bg-muted/40">
                      <b className="w-24">{order.number}</b>
                      <span className="text-muted-foreground">{formatDate(order.created_at, locale)}</span>
                      <OrderStatusBadge status={order.status} />
                      <PaymentBadge status={order.payment_status} />
                      <b className="ml-auto tabular-nums">{formatMoney(order.total, locale)}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={u.addresses}>
            {user.addresses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{u.noAddresses}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {user.addresses.map((address) => (
                  <li key={address.id} className="flex gap-2 rounded-xl bg-muted p-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {address.title && <b className="block">{address.title}</b>}
                      {address.full}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={t.admin.users.contacts}>
            <a href={`mailto:${user.email}`} className="flex items-center gap-2 break-all text-sm hover:underline">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              {user.email}
              {user.email_verified_at && <BadgeCheck className="size-4 shrink-0 text-success" aria-label={u.emailVerified} />}
            </a>
            {user.phone && phone && (
              <a href={`tel:+${phone}`} className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Phone className="size-4" />
                {formatPhone(user.phone)}
              </a>
            )}
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-4" />
              {fmt(u.since, { date: formatDate(user.created_at, locale) })}
            </p>
            {!user.is_staff && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                {phone && (
                  <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-sm font-semibold hover:bg-muted">
                    {t.admin.common.whatsapp}
                  </a>
                )}
                <ChatWithCustomer userId={user.id} />
              </div>
            )}
          </Panel>

          <Panel title={u.management}>
            {role === "admin" || user.id === me.id ? (
              <p className="text-sm text-muted-foreground">{u.cannotManageAdmin}</p>
            ) : (
              <UserAdminActions userId={user.id} role={role} blocked={user.is_blocked} phone={user.phone} />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
