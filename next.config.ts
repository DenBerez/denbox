import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
   // Add a TypeScript configuration to allow skipping type-checking during builds
   typescript: {
    // Ignore type errors during builds when the `SKIP_TYPE_CHECK` environment variable is set
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "1",
  },
};

export default nextConfig;
