import security from "./lib/security.js";

const { getSecurityHeaders } = security;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateEtags: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],

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
