import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  experimental: {
    // Only the parts of the kit a page really uses end up in its scripts.
    optimizePackageImports: ["radix-ui"],
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
  // Files of public/ have no hash in their names, so Next.js makes browsers ask about them on every visit.
  async headers() {
    return [
      // The folder is named after the library version: a new version is a new address.
      { source: "/vendor/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/hero/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
