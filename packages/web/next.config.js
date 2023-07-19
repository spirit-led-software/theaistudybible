/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@revelationsai/core"],
  webpack: (webpackConfig, { webpack }) => {
    webpackConfig.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    return webpackConfig;
  },
};

module.exports = nextConfig;
