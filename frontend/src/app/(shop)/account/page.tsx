import type { Metadata } from "next";
import { Heart, Mail, Phone, ShoppingCart, UserRound } from "lucide-react";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { formatDate, formatPhone } from "@/shared/lib/format";
import { Badge, Breadcrumbs, ButtonLink, Container } from "@/shared/ui";

export const metadata: Metadata = { title: "Личный кабинет", robots: { index: false } };

const roleLabels: Record<string, string> = { admin: "Администратор", manager: "Менеджер", client: "Покупатель" };

/**
 * Account overview (first version): who is signed in and the way out.
 * Orders, addresses and settings come with stage 6.
 */
export default async function AccountPage() {
  const user = await requireUser(routes.account);
  const role = user.roles?.[0] ?? "client";

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Главная", href: routes.home }, { label: "Личный кабинет" }]} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-ink font-display text-2xl font-extrabold text-brand ring-2 ring-brand ring-offset-2 ring-offset-background">
            {user.name.charAt(0)}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Здравствуйте, {user.name.split(" ")[0]}!</h1>
            <p className="mt-1 text-sm text-muted">С нами с {formatDate(user.created_at)}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <UserRound className="size-5 text-brand" />
            Профиль
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted" />
              <dd className="break-all">{user.email}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted" />
              <dd>{user.phone ? formatPhone(user.phone) : <span className="text-muted">Телефон не указан</span>}</dd>
            </div>
          </dl>
          <Badge tone={role === "client" ? "muted" : "dark"} className="mt-4">
            {roleLabels[role] ?? role}
          </Badge>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <h2 className="font-bold">Что дальше</h2>
          <p className="mt-2 text-sm text-muted">
            Выберите материалы в каталоге и добавьте в корзину. Менеджер позвонит в течение 15–30 минут, чтобы подтвердить заказ и доставку.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href={routes.catalog}>Перейти в каталог</ButtonLink>
            <ButtonLink href={routes.cart} variant="outline">
              <ShoppingCart className="size-4" />
              Корзина
            </ButtonLink>
            <ButtonLink href={routes.favorites} variant="outline">
              <Heart className="size-4" />
              Избранное
            </ButtonLink>
          </div>
        </section>
      </div>
    </Container>
  );
}
