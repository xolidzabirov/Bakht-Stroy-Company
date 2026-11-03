import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Styles arrive inside the HTML: no render-blocking CSS request for first-time visitors (Tailwind keeps it small).
    inlineCss: true,
    // The dev cache on disk kept serving old styles and 404s after restarts; a cold start is the smaller price.
    turbopackFileSystemCacheForDev: false,
  },
  // Docker builds a self-contained server (frontend/Dockerfile); Vercel uses its own output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: {
    // The backend already serves resized WebP previews (thumb / card / full),
    // so Next.js does not need to optimize them again.
    unoptimized: true,
  },
};

export default nextConfig;
