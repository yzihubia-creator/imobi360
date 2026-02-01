import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Acknowledge Turbopack usage (stable in Next.js 16)
  turbopack: {},

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig
