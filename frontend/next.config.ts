import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the floating dev-tools badge in `next dev`. It never shipped to
  // production, but it sits on top of the mobile tab bar while working.
  // Compile and runtime errors are still surfaced.
  devIndicators: false,
};

export default nextConfig;
