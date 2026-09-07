/** @type {import('next').NextConfig} */
const path = require("path");
const fs = require("fs");

const nextConfig = {
  reactStrictMode: false,
  experimental: {},
  images: {
    unoptimized: process.env.NEXT_PUBLIC_SEO === "false",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.ximmo24.de",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dev-ebroker.thewrteam.in",
        // port: '',
        pathname: "**",
        // search: '',
      }
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    path: "/_next/image/",
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
  },
  trailingSlash: true,
  devIndicators: {
    buildActivity: false,
  },
};
if (process.env.NEXT_PUBLIC_SEO === "false") {
  nextConfig.output = "export";
  nextConfig.exportPathMap = async (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId },
  ) => {
    if (dir && outDir && fs.existsSync(path.join(dir, ".htaccess"))) {
      fs.copyFileSync(
        path.join(dir, ".htaccess"),
        path.join(outDir, ".htaccess"),
      );
    } else {
    }
    return defaultPathMap;
  };
}
if (process.env.NEXT_OUTPUT_STANDALONE === "true" || process.env.VERCEL === "1") {
  nextConfig.output = "standalone";
  delete nextConfig.exportPathMap;
}
module.exports = nextConfig;
