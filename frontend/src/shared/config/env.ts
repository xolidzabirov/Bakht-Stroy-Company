/**
 * Environment settings.
 * API_URL is read on the server (Server Components, Route Handlers);
 * NEXT_PUBLIC_API_URL is also available in the browser.
 */
export const env = {
  apiUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
