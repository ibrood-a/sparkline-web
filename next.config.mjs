/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.ytimg.com'],
  },
  reactStrictMode: true,
  experimental: {
    appDir: true, // Ensure this is enabled if you are using the /app directory structure
  },
}

export default nextConfig
