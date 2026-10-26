import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { env } from "@/shared/config/env";
import { site } from "@/shared/config/site";
import { getI18n, getTheme } from "@/shared/i18n/server";
import "@/shared/ui/styles/globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-manrope", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();

  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t.meta.title, template: `%s — ${site.shortName}` },
    description: t.meta.description,
    openGraph: { type: "website", locale: locale === "en" ? "en_US" : locale === "tg" ? "tg_TJ" : "ru_RU", siteName: site.name },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
};

// Before the first paint: pick light/dark from the device when the visitor has not chosen yet.
const themeScript = `(function(){try{var d=document.documentElement;if(!d.dataset.theme){d.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}}catch(e){}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ locale }, theme] = await Promise.all([getI18n(), getTheme()]);

  return (
    <html
      lang={locale}
      data-theme={theme === "system" ? undefined : theme}
      className={`${inter.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
