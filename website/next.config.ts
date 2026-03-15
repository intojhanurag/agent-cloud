import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: "http://localhost:4321/docs",
      },
      {
        source: "/docs/:path*",
        destination: "http://localhost:4321/docs/:path*",
      },
    ];
  },
};

export default nextConfig;
