/** @type {import('next').NextConfig} */
const nextConfig = {
  // Issue #48: Safe production optimizations that don't require additional packages

  // Disable static page generation to fix useSearchParams() errors
  output: 'standalone',

  // Disable source maps in production for security (safe, built-in)
  productionBrowserSourceMaps: false,

  // Enable compression (safe, built-in)
  compress: true,

  // Hide powered by header for security (safe, built-in)
  poweredByHeader: false,
  
  // Original headers plus basic security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          // Basic security headers (safe to add)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig