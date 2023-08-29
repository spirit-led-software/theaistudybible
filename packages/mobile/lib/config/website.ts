export type WebsiteConfig = {
  url: string;
};

export const config: WebsiteConfig = {
  url: process.env.EXPO_PUBLIC_WEBSITE_URL!,
};

export default config;
