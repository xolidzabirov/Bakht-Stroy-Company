import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, MessageSquareText, Phone, Store, UserRound } from "lucide-react";
import { OrderStatusBadge, PaymentBadge } from "@/entities/order/ui/OrderStatus";
import { ChatWithCustomer, OrderPaymentActions, OrderStatusActions } from "@/features/admin-orders/ui/OrderAdminActions";
import { ApiError } from "@/shared/api/http";
import { isAdmin, requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminOrder } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney, formatPhone } from "@/shared/lib/format";
import { PageHeader, Panel } from "@/widgets/admin-shell/ui/PageHeader";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return { title: fmt((await getI18n()).t.admin.order.title, { number: decodeURIComponent(number) }) };
}

async function loadOrder(number: string): Promise<AdminOrder> {
  try {
    return (await userFetch<{ data: AdminOrder }>(`/admin/orders/number/${encodeURIComponent(number)}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** One order for the shop team: items and totals, status steps, payment, customer, delivery, history. */
export default async function AdminOrderPage({ params }: Props) {
  const number = decodeURIComponent((await params).number);
  const [user, { t, locale }, order] = await Promise.all([requireStaff(routes.adminOrder(number)), getI18n(), loadOrder(number)]);
  const o = t.admin.order;
  const money = (value: number) => formatMoney(value, locale);
  const dateTime = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const phone = order.customer.phone.replace(/\D/g, "");
  const closed = ["completed", "cancelled"].includes(order.status.value);
  const address = order.address;

  return (
    <div>
      <PageHeader
        back={{ href: routes.adminOrders, label: o.back }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {fmt(o.title, { number: order.number })}
            <OrderStatusBadge status={order.status} className="text-sm" />
          </span>
        }
        description={fmt(o.created, { date: dateTime.format(new Date(order.created_at)) })}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel title={o.items}>
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 pb-2 font-semibold sm:px-5">{t.admin.products.product}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{o.price}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{o.qty}</th>
                    <th className="px-4 pb-2 text-right font-semibold sm:px-5">{o.sum}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-3">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="size-11 shrink-0 rounded-lg bg-muted object-cover" />
                          ) : (
                            <span className="size-11 shrink-0 rounded-lg bg-muted" />
                          )}
                          <span className="min-w-0">
                            {item.product_id ? (
                              <Link href={routes.adminProduct(item.product_id)} className="font-medium hover:underline">
                                {item.name}
                              </Link>
                            ) : (
                              <span className="font-medium">{item.name}</span>
                            )}
                            {item.sku && <span className="block text-xs text-muted-foreground">{item.sku}</span>}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{money(item.price)}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">
                        {item.quantity} {t.admin.product.units[item.unit.value] ?? item.unit.label}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums sm:px-5">{money(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="ml-auto mt-4 max-w-xs space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{o.subtotal}</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{o.deliveryPrice}</dt>
                <dd className="tabular-nums">{order.delivery_price ? money(order.delivery_price) : o.free}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{o.discount}</dt>
                  <dd className="tabular-nums">−{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold">
                <dt>{o.total}</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title={o.history}>
            <ol className="relative space-y-4 border-l-2 border-border pl-5">
              {order.history.map((entry, index) => (
                <li key={`${entry.created_at}-${index}`} className="relative">
                  <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-surface bg-primary" />
                  <span className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={entry.status} />
                    <span className="text-xs text-muted-foreground">{dateTime.format(new Date(entry.created_at))}</span>
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{entry.author ? fmt(o.by, { name: entry.author.name }) : o.system}</span>
                  {entry.comment && <p className="mt-1.5 rounded-xl bg-muted px-3 py-2 text-sm">{entry.comment}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={o.nextStep}>
            <OrderStatusActions orderId={order.id} next={order.next_statuses} paid={order.payment_status.value === "paid"} />
          </Panel>

          <Panel title={o.payment}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <PaymentBadge status={order.payment_status} />
              <span className="text-xs text-muted-foreground">{order.payment_method.label}</span>
            </div>
            <OrderPaymentActions orderId={order.id} status={order.payment_status.value} closed={closed} />
          </Panel>

          <Panel title={o.customer}>
            <p className="flex items-center gap-2 font-bold">
              <UserRound className="size-4 text-muted-foreground" />
              {order.customer.name}
            </p>
            <a href={`tel:+${phone}`} className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <Phone className="size-4" />
              {formatPhone(order.customer.phone)}
            </a>
            <a href={`mailto:${order.customer.email}`} className="mt-1 flex items-center gap-2 break-all text-sm text-muted-foreground hover:underline">
              <Mail className="size-4 shrink-0" />
              {order.customer.email}
            </a>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:+${phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-success px-3.5 text-sm font-semibold text-white hover:bg-success/90">
                <Phone className="size-4" />
                {t.admin.common.call}
              </a>
              <a href={`https://wa.me/${phone}?text=${encodeURIComponent(fmt(o.title, { number: order.number }))}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-sm font-semibold hover:bg-muted">
                {t.admin.common.whatsapp}
              </a>
              {order.user && !order.user.is_deleted && <ChatWithCustomer userId={order.user.id} />}
            </div>
            {order.user && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {o.account}:{" "}
                {order.user.is_deleted ? (
                  o.deletedAccount
                ) : isAdmin(user) ? (
                  <Link href={routes.adminUser(order.user.id)} className="font-semibold text-foreground hover:underline">
                    {order.user.name}
                  </Link>
                ) : (
                  order.user.name
                )}
              </p>
            )}
          </Panel>

          <Panel title={o.receiving}>
            {order.delivery_type.value === "pickup" || !address ? (
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Store className="size-4 text-muted-foreground" />
                {o.pickup}
              </p>
            ) : (
              <p className="flex gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {[address.city, address.street, address.house, address.apartment].filter(Boolean).join(", ")}
                  {address.comment && <span className="mt-1 block text-xs text-muted-foreground">{address.comment}</span>}
                </span>
              </p>
            )}
            {order.comment && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <MessageSquareText className="size-3.5" />
                  {o.comment}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{order.comment}</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
