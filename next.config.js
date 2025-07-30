/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Ignore ALL TypeScript errors for POC deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ALL ESLint errors during build  
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Skip TypeScript type checking during build
    typedRoutes: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*'
      }
    ];
  }
};

module.exports = nextConfig;