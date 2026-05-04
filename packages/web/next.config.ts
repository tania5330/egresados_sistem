import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/trpc/:path*",
        destination: "http://127.0.0.1:3001/trpc/:path*",
      },
    ];
  },
};

export default nextConfig;
