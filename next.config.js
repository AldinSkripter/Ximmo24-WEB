/** @type {import('next').NextConfig} */
const path = require("path");
const fs = require("fs");

const nextConfig = {
  reactStrictMode: false,
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dev-ebroker.thewrteam.in",
        // port: '',
        pathname: "**",
        // search: '',
      }
    ],
    unoptimized: true,
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
