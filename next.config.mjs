const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/sources/:path*',
        destination: 'https://streamvault-backend-vkxl.vercel.app/sources/:path*',
      },
      {
        source: '/api/discover/:path*',
        destination: 'https://streamvault-backend-vkxl.vercel.app/api/discover/:path*',
      },
    ];
  },
};
export default nextConfig;
