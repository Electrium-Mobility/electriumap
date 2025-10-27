import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  /* configuration for profile pictures */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['localhost'],
    unoptimized: true, 
    contentSecurityPolicy: "default-src 'self'; img-src 'self' data: blob: https:;",
  },
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
