/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/sources/:path*',
        destination: 'https://streamvault-backend-vkxl.vercel.app/sources/:path*', // 👈 replace this
      },
    ];
  },
}

export default nextConfig;