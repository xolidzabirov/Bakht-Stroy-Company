import { getI18n } from "@/shared/i18n/server";

/** First thing a keyboard user meets: jumps past the header straight to the page (visible only on Tab). */
export async function SkipLink({ target = "content" }: { target?: string }) {
  const { t } = await getI18n();

  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-xl focus:outline-none focus:ring-[3px] focus:ring-brand"
    >
      {t.common.skipToContent}
    </a>
  );
}
