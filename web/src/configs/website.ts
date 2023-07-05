export type WebsiteConfig = {
  websiteUrl: string;
};

export const config: WebsiteConfig = {
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL as string,
};

export default config;
