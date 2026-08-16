import type { NextConfig } from "next";

// For GitHub Pages deployment, set basePath to your repo name, e.g. "/my-repo"
// For local development, leave it empty or undefined.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Change to "standalone" for dev server, "export" for GitHub Pages static build
  output: process.env.NODE_ENV === "production" ? "export" : "standalone",
  basePath: basePath || undefined,
  // Trailing slash is recommended for GitHub Pages
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
