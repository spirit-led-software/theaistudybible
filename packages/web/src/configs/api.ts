interface ApiConfig {
  url: string;
  chatUrl: string;
}

export const config: ApiConfig = {
  url: process.env.NEXT_PUBLIC_API_URL!,
  chatUrl: process.env.NEXT_PUBLIC_CHAT_API_URL!,
};

export default config;
