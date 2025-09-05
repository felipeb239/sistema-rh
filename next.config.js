/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.externals.push({
      'pdfkit': 'commonjs pdfkit',
    });
    return config;
  },
}

module.exports = nextConfig
