export type ApiConfig = {
  url: string;
  chatUrl: string;
};

export const config: ApiConfig = {
  url: process.env.EXPO_PUBLIC_API_URL!,
  chatUrl: process.env.EXPO_PUBLIC_CHAT_API_URL!,
};

export default config;
