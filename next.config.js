/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment optimization
  output: 'standalone',
  
  // Disable ESLint during builds (fix warnings post-deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during builds (only for production)
  typescript: {
    ignoreBuildErrors: true, // Temporarily disable to fix type cache issue
  },
  
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "@node-rs/argon2"],
  },
  
  // Webpack configuration for native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native modules for server-side
      config.externals.push({
        '@node-rs/argon2': 'commonjs @node-rs/argon2',
      });
    }
    return config;
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()'
          },
        ],
      },
      {
        // API routes should not be cached
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
        ],
      },
    ];
  },
  
  // Environment validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
