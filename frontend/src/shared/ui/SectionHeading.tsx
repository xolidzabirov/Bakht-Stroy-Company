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
    <div className="mb-7 flex items-end justify-between gap-4 sm:mb-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
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
