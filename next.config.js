/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Hostinger Node.js icin
  reactStrictMode: true,
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
