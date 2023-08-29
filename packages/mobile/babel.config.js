module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Required for expo-router
      "expo-router/babel",
      "nativewind/babel",
      [
        "module-resolver",
        {
          alias: {
            "@core": "../core/src",
            "@app": "./app",
            "@assets": "./assets",
            "@components": "./lib/components",
            "@constants": "./lib/constants",
            "@config": "./lib/config",
            "@hooks": "./lib/hooks",
            "@services": "./lib/services",
            "@util": "./lib/util",
            "@lib": "./lib",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      ],
    ],
  };
};
