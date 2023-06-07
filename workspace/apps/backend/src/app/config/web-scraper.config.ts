type WebScraperConfig = {
  threads: number;
};

export const config: WebScraperConfig = {
  threads: process.env.WEB_SCRAPER_THREADS
    ? parseInt(process.env.WEB_SCRAPER_THREADS, 10)
    : 5,
};

export default config;
