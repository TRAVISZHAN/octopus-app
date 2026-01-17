import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  assetPrefix: './',
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || 'https://github.com/bestruirui/octopus',
    NEXT_PUBLIC_DESKTOP_REPO: process.env.NEXT_PUBLIC_DESKTOP_REPO || 'https://github.com/TRAVISZHAN/octopus-app',
  },
};

export default nextConfig;


