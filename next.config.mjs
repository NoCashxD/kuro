/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable API routes
  experimental: {
    serverExternalPackages: ['mysql2']
  },
  
  // Environment variables for Vercel
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Rewrite rules for API compatibility
  async rewrites() {
    return [
      {
        source: '/connect',
        destination: '/api/connect',
      },
    ];
  },
};

export default nextConfig;
