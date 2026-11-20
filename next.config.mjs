/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors fail the build. v1 hid them with ignoreBuildErrors.
  poweredByHeader: false,
  async redirects() {
    return [
      // The ranked list moved onto the home page in v2. Keep old links working.
      { source: "/destinations", destination: "/", permanent: true },
      // Short alias for the ranked list.
      { source: "/sun", destination: "/", permanent: false },
    ]
  },
}

export default nextConfig
