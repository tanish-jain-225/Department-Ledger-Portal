import security from "./lib/security.js";

const { getSecurityHeaders } = security;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateEtags: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // ── Image Optimization ───────────────────────────────────────────────────────
  // Enable AVIF/WebP for best-in-class compression on supported browsers.
  // Allowlist Firebase Storage as a remote image source for future avatar/
  // document thumbnail features.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|public/).*)",
        headers: getSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;

