import type { Metadata } from "next";
import { Inbox, Mail, Phone, UserCheck } from "lucide-react";
import { TabFilter } from "@/features/admin-filters/ui/Filters";
import { MessageActions } from "@/features/admin-messages/ui/MessageActions";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { formatPhone } from "@/shared/lib/format";
import { Pagination } from "@/shared/ui/Pagination";
import { EmptyState, PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.messages.title };
}

type Message = { id: number; name: string; phone: string; email: string | null; message: string; user_id: number | null; is_read: boolean; read_at: string | null; created_at: string };
type Page = { data: Message[]; meta: { current_page: number; last_page: number; total: number; unread_count: number } };

/** Questions from the Contacts form: unread first in the tab, call / WhatsApp / email in one tap. */
export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ unread?: string; page?: string }> }) {
  await requireStaff(routes.adminMessages);
  const { unread, page } = await searchParams;
  const query = new URLSearchParams({ per_page: "20", ...(unread ? { unread: "1" } : {}), ...(page ? { page } : {}) });
  const [{ t, locale }, messages] = await Promise.all([getI18n(), userFetch<Page>(`/admin/messages?${query}`)]);
  const m = t.admin.messages;
  const dateTime = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const pageHref = (n: number) => `${routes.adminMessages}?${new URLSearchParams({ ...(unread ? { unread: "1" } : {}), page: String(n) })}`;

  return (
    <div className="max-w-4xl">
      <PageHeader title={m.title} description={m.lead} />
      <div className="mb-4">
        <TabFilter
          name="unread"
          tabs={[
            { value: null, label: m.all },
            { value: "1", label: m.unread, count: messages.meta.unread_count },
          ]}
        />
      </div>

      {messages.data.length === 0 ? (
        <EmptyState icon={Inbox} title={m.empty} text={m.emptyText} />
      ) : (
        <>
          <ul className="space-y-3">
            {messages.data.map((message) => {
              const digits = message.phone.replace(/\D/g, "");
              return (
                <li key={message.id} className={cn("rounded-2xl border bg-surface p-4 sm:p-5", message.is_read ? "border-border" : "border-primary/50 ring-2 ring-primary/15")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        {!message.is_read && <span className="size-2.5 rounded-full bg-primary" />}
                        {message.name}
                        {message.user_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            <UserCheck className="size-3" />
                            {m.registered}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{dateTime.format(new Date(message.created_at))}</p>
                    </div>
                    <MessageActions id={message.id} read={message.is_read} name={message.name} />
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{message.message}</p>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <a href={`tel:+${digits}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-success px-3.5 text-sm font-semibold text-white hover:bg-success/90">
                      <Phone className="size-4" />
                      {formatPhone(message.phone)}
                    </a>
                    <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-sm font-semibold hover:bg-muted">
                      {t.admin.common.whatsapp}
                    </a>
                    {message.email && (
                      <a href={`mailto:${message.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-semibold hover:bg-muted">
                        <Mail className="size-4" />
                        {message.email}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination page={messages.meta.current_page} lastPage={messages.meta.last_page} href={pageHref} />
        </>
      )}
    </div>
  );
}
