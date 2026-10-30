import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { env } from "@/shared/config/env";
import { site } from "@/shared/config/site";
import { locales, THEME_COOKIE } from "@/shared/i18n/config";
import { getI18n, setLocaleFrom } from "@/shared/i18n/server";
import "@/shared/ui/styles/globals.css";
import { Providers } from "./providers";

// `subsets` only says which files are preloaded; the other ranges (cyrillic-ext: the Tajik ҳ қ ғ ҷ ӣ ӯ) are still
// declared and download on their own, only on pages that use those letters. Preloading all 6 files (133 KB)
// held back the first picture on slow phones, so: the body font preloads latin + cyrillic (2 files),
// the heading font swaps in when ready (size-adjusted fallback, no layout shift).
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", display: "swap", preload: false });

type Props = Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>;

/**
 * Public pages are prerendered once per language; the proxy picks the language from the visitor's cookie.
 * (No `dynamicParams = false` here: it would also forbid product and post slugs rendered on demand.
 * An unknown language never reaches this segment — the proxy only rewrites to the known ones.)
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  await setLocaleFrom(params);
  const { t, locale } = await getI18n();

  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t.meta.title, template: `%s — ${site.shortName}` },
    description: t.meta.description,
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : locale === "tg" ? "tg_TJ" : "ru_RU",
      siteName: site.name,
      // The brand card from app/opengraph-image.tsx; products and posts put their own photo instead.
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
};

// Before the first paint: the theme the visitor chose (cookie), otherwise the device setting.
// Read in the browser, so the page itself stays the same for everyone and can be cached.
const themeScript = `(function(){try{var d=document.documentElement,m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);d.dataset.theme=m?m[1]:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}})()`;

export default async function RootLayout({ children, params }: Props) {
  await setLocaleFrom(params);
  const { locale, t } = await getI18n();

  return (
    <html lang={locale} className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers locale={locale} dictionary={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
