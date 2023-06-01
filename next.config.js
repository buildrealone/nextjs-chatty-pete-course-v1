/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      's.gravatar.com',
      // 'secure.gravatar.com',
      'lh3.googleusercontent.com',
    ],
  }
}

module.exports = nextConfig
