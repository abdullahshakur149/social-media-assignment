/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    scrollRestoration: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
