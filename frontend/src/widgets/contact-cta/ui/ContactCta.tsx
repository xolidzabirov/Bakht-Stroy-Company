import { MessageCircle, Phone, Send } from "lucide-react";
import { formatPhone } from "@/shared/lib/format";
import { Container } from "@/shared/ui";

type Props = {
  phone?: string;
  whatsapp?: string | null;
  telegram?: string | null;
  telegramChat?: string | null;
};

/**
 * "Need a calculation?" block with quick contact buttons.
 */
export function ContactCta({ phone, whatsapp, telegram, telegramChat }: Props) {
  const telegrams = [telegram, telegramChat].filter((url): url is string =>
    Boolean(url),
  );

  return (
    <Container className="mt-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-10 text-ink sm:px-12 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full border-[28px] border-ink/10"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Посчитаем материалы для вашего объекта
            </h2>
            <p className="mt-3 max-w-xl text-base text-ink/75">
              Пришлите размеры или проект — менеджер бесплатно рассчитает
              количество, стоимость и доставку.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-5 font-semibold text-white"
              >
                <Phone className="size-4 text-brand" />
                {formatPhone(phone)}
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            )}
            {telegrams.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold"
              >
                <Send className="size-4" />@{url.split("/").pop()}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
