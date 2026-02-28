import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress Clerk peer dep warnings in build output
  transpilePackages: ["@clerk/nextjs"],
  // Allow Railway internal URLs for RAG service
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
