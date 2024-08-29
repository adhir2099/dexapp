/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/register-proxy',
            destination: '/api/actual-endpoint',
          },
        ];
    },
    images: {
        domains: ['raw.githubusercontent.com'],
    },
    crossOrigin: 'anonymous',
}

export default nextConfig;
