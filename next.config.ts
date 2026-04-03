import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";
const API_BASE = API_URL.replace(/\/api\/v1$/, "");

const nextConfig: NextConfig = {
  // ⭐ Proxy /api → backend admin API (same-origin สำหรับ httpOnly cookie)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
