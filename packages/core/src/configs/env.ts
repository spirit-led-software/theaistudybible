interface EnvironmentConfig {
  isLocal: boolean;
  env: string;
  development: boolean;
}

export const config: EnvironmentConfig = {
  isLocal: process.env.IS_LOCAL === "true",
  env: process.env.NODE_ENV || "development",
  development: process.env.NODE_ENV !== "production",
};

export default config;
