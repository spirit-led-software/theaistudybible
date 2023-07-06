export type EnvironmentConfig = {
  env: string;
  development: boolean;
};

export const config: EnvironmentConfig = {
  env: process.env.NODE_ENV || "development",
  development: process.env.NODE_ENV !== "production",
};

export default config;
