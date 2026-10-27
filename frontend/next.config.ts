import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Docker builds a self-contained server (frontend/Dockerfile); Vercel uses its own output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: {
    // The backend already serves resized WebP previews (thumb / card / full),
    // so Next.js does not need to optimize them again.
    unoptimized: true,
  },
};

export default nextConfig;
