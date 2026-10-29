import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Eye } from "lucide-react";
import { getNewsItem } from "@/entities/news/api/getNews";
import { getSettings } from "@/entities/settings/api/getSettings";
import { env } from "@/shared/config/env";
import { routes, site } from "@/shared/config/site";
import { fmt, plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { Badge, Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ContactCta } from "@/widgets/contact-cta/ui/ContactCta";
import { NewsGallery } from "@/widgets/news-article/ui/NewsGallery";
import { NewsSection } from "@/widgets/news-section/ui/NewsSection";
import { ProductGrid } from "@/widgets/product-grid/ui/ProductGrid";

type Props = { params: Promise<{ slug: string }> };

const sharePill = "inline-flex h-9 items-center rounded-full border border-border px-4 font-semibold transition hover:border-foreground/40";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [news, { t }] = await Promise.all([getNewsItem((await params).slug), getI18n()]);

  if (!news) return { title: t.meta.newsNotFound };

  const title = news.meta.title || news.title;
  const description = news.meta.description || news.excerpt;

  return {
    title,
    description,
    alternates: { canonical: routes.newsItem(news.slug) },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: news.published_at ?? undefined,
      images: news.cover ? [news.cover.full] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const [news, settings, { t, locale }] = await Promise.all([getNewsItem(slug), getSettings(), getI18n()]);

  if (!news) notFound();

  const url = `${env.siteUrl}${routes.newsItem(news.slug)}`;
  const typeLabel = t.news.types[news.type.value] ?? news.type.label;

  // Structured data for Google: headline, picture and date of the post.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": news.type.value === "article" ? "Article" : "NewsArticle",
    headline: news.title,
    description: news.meta.description || news.excerpt,
    image: news.cover ? [news.cover.full] : undefined,
    datePublished: news.published_at ?? undefined,
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${env.siteUrl}/icon.png` } },
  };

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.news.title, href: routes.news }, { label: news.title }]} />

        <article className="mx-auto mt-6 max-w-3xl">
          <header>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <Link href={`${routes.news}?type=${news.type.value}`}>
                <Badge tone={news.type.value === "promo" ? "brand" : "dark"}>{typeLabel}</Badge>
              </Link>
              {news.published_at && <time dateTime={news.published_at}>{formatDate(news.published_at, locale)}</time>}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {fmt(t.news.readingTime, { count: news.reading_time })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" />
                {news.views_count} {plural(locale, news.views_count, t.news.views)}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{news.title}</h1>
          </header>

          {news.cover && (
            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted">
              <Image src={news.cover.full} alt={news.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            </div>
          )}

          {/* The API cleans the HTML of the post (only formatting, links and pictures are kept). */}
          <div className="prose-bakht mt-6 text-[17px]" dangerouslySetInnerHTML={{ __html: news.body }} />

          {news.video_embed_url && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold">{t.news.video}</h2>
              <div className="relative mt-4 aspect-video overflow-hidden rounded-[var(--radius-card)] bg-black">
                <iframe
                  src={news.video_embed_url}
                  title={`${t.news.video}: ${news.title}`}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 size-full"
                />
              </div>
            </section>
          )}

          <NewsGallery images={news.gallery ?? []} title={news.title} />

          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6 text-sm">
            <span className="mr-1 font-semibold">{t.news.share}</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${news.title} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={sharePill}>
              WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(news.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={sharePill}
            >
              Telegram
            </a>
          </div>

          {(news.previous || news.next) && (
            <nav aria-label={t.common.pages} className="mt-6 grid gap-3 sm:grid-cols-2">
              {news.previous ? (
                <Link href={routes.newsItem(news.previous.slug)} className="group rounded-2xl border border-border p-4 transition hover:border-foreground/40">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                    {t.news.previous}
                  </span>
                  <span className="mt-1 line-clamp-2 block font-semibold">{news.previous.title}</span>
                </Link>
              ) : (
                <span aria-hidden className="hidden sm:block" />
              )}
              {news.next && (
                <Link href={routes.newsItem(news.next.slug)} className="group rounded-2xl border border-border p-4 transition hover:border-foreground/40 sm:text-right">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {t.news.next}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 line-clamp-2 block font-semibold">{news.next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </article>
      </Container>

      <ProductGrid title={t.news.products} products={news.products ?? []} />
      <NewsSection news={news.related ?? []} title={t.news.related} />
      <ContactCta phone={settings.phones[0]} whatsapp={settings.socials?.whatsapp} telegram={settings.socials?.telegram} telegramChat={settings.socials?.telegram_chat} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
