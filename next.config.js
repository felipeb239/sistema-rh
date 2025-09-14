/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '192.168.10.31'],
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
  },
}

module.exports = nextConfig
