import type { NextConfig } from "next";
import "./env";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // typedRoutes: true,
};

export default nextConfig;
