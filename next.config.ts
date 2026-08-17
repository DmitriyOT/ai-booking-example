import type { NextConfig } from "next";

// Для деплоя на GitHub Pages задайте имя репозитория в GitHub Actions
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Static export только для production build (GitHub Pages)
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  basePath: basePath || undefined,
  trailingSlash: basePath ? true : false,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
};

export default nextConfig;
