export type ApiConfig = {
  url: string;
};

export const config: ApiConfig = {
  url: process.env.API_URL!,
};

export default config;
