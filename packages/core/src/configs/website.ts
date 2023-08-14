interface WebsiteConfig {
  url: string;
}

export const config: WebsiteConfig = {
  url: process.env.WEBSITE_URL!,
};

export default config;
