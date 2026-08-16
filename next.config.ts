import type { NextConfig } from "next";

// Для деплоя на GitHub Pages задайте имя репозитория:
// export NEXT_PUBLIC_BASE_PATH=/your-repo-name  (в GitHub Secrets)
// При локальной разработке basePath не нужен.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: basePath ? true : false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
