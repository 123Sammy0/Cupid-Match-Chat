import type { NextConfig } from "next";

const buildVersion = 
  process.env.VERCEL_GIT_COMMIT_SHA || 
  process.env.CF_PAGES_COMMIT_SHA || 
  Date.now().toString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },
};

export default nextConfig;
