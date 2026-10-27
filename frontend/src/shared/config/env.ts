/**
 * Environment settings.
 * API_URL is read on the server (Server Components, Route Handlers);
 * NEXT_PUBLIC_API_URL is also available in the browser.
 */
export const env = {
  apiUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Live chat WebSocket (Laravel Reverb). Without a key the chat works by polling. */
  reverb: {
    key: process.env.NEXT_PUBLIC_REVERB_KEY ?? "",
    host: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    port: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http",
  },
} as const;
