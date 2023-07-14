const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
  output: "standalone",
  transpilePackages: ["@chatesv/core"],
};

module.exports = nextConfig;
