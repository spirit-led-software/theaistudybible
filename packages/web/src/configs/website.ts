export type WebsiteConfig = {
  url: string;
};

export const websiteConfig: WebsiteConfig = {
  url: process.env.NEXT_PUBLIC_WEBSITE_URL!,
};

export default websiteConfig;
