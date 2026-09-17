import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Badge dev Next.js di pojok kiri bawah ikut terpotret saat membuat tutorial,
  // padahal tidak pernah ada di produksi. Dimatikan supaya gambar panduan bersih.
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
