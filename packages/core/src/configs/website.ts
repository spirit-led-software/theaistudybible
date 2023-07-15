export type WebsiteConfig = {
  url: string;
};

export const config: WebsiteConfig = {
  url: process.env.WEBSITE_URL as string,
};

export default config;
