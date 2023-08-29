export type ApiConfig = {
  url: string;
  chatUrl: string;
};

export const config: ApiConfig = {
  url: process.env.API_URL!,
  chatUrl: process.env.CHAT_API_URL!,
};

export default config;
