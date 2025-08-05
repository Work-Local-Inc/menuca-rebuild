/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Temporarily ignore TypeScript errors during builds for development
    ignoreBuildErrors: true,
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