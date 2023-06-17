export type WebScraperConfig = {
  threads: number;
};

export const config: WebScraperConfig = {
  threads: parseInt(process.env.WEB_SCRAPER_THREADS) || 4,
};

export default config;
