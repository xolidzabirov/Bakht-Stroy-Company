import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // The backend already serves resized WebP previews (thumb / card / full),
    // so Next.js does not need to optimize them again.
    unoptimized: true,
  },
};

export default nextConfig;
