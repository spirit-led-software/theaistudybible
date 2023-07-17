interface ApiConfig {
  url: string;
}

export const config: ApiConfig = {
  url: process.env.NEXT_PUBLIC_API_URL!,
};

export default config;
