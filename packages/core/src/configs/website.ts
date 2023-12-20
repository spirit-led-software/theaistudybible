interface WebsiteConfig {
  url: string;
  authUrl: string;
}

export const config: WebsiteConfig = {
  url: process.env.PUBLIC_WEBSITE_URL!,
  authUrl: process.env.PUBLIC_AUTH_URL!
};

export default config;
