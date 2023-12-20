export type ApiConfig = {
  url: string;
};

export const config: ApiConfig = {
  url: process.env.PUBLIC_API_URL!
};

export default config;
