/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  output: "standalone",
  transpilePackages: ["@chatesv/core"],
};

module.exports = nextConfig;
