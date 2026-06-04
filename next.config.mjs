import { execSync } from 'child_process'
import { readFileSync } from 'fs'

let buildSha = 'dev'
try {
  buildSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {}

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
