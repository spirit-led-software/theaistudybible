interface WebsiteConfig {
  url: string;
  authUrl: string;
}

export const config: WebsiteConfig = {
  url: process.env.WEBSITE_URL!,
  authUrl: process.env.AUTH_URL!
};

export default config;
