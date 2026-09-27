import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aa/contracts", "@aa/core", "@aa/db"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
