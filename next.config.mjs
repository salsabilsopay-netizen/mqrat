/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['node:sqlite', 'puppeteer-core', '@sparticuz/chromium'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
