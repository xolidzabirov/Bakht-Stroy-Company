import type { MetadataRoute } from "next";
import { env } from "@/shared/config/env";

/** Search engines see the shop; personal pages, the admin panel and the API proxy stay out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/cart", "/checkout", "/favorites", "/api/"] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
