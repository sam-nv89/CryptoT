import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CCXT uses Node.js APIs — ensure API routes run in nodejs runtime
  serverExternalPackages: ['ccxt'],

  // Disable image optimization for exchange logos (we'll use SVGs)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
