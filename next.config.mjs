/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateEtags: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  
  async headers() {
    return [
      {
        // Apply security headers to all routes except Next.js internal chunks and static assets
        source: "/((?!_next/static|_next/image|favicon.ico|public/).*)",
        headers: [
          // Prevent site from being embedded inside iframe layouts (Clickjacking defense)
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent browser from sniffing MIME types away from declared content-type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Force strict HTTPS protocol usage
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          // Limit referrer information passed to other sites
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
