import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { getI18n } from "@/shared/i18n/server";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
  linkText?: string;
};

export async function SectionHeading({ title, subtitle, href, linkText }: Props) {
  const { t } = await getI18n();

  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-muted-foreground sm:inline-flex"
        >
          {linkText ?? t.common.seeAll}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
