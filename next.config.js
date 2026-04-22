/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig
