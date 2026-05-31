/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep a non-dev's first run smooth: don't fail the build on lint warnings.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
