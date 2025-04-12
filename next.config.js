/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'SameSite=None; Secure'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.google-analytics.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https://*.google-analytics.com;
              connect-src 'self' https://*.google-analytics.com;
              frame-src 'self' https://*.google.com;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
