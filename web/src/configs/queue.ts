export type IndexFileQueueConfig = {
  name: string;
  concurrency: number;
};

export type IndexWebsiteQueueConfig = {
  name: string;
  concurrency: number;
};

export type QueueConfig = {
  indexFileQueue: IndexFileQueueConfig;
  indexWebsiteQueue: IndexWebsiteQueueConfig;
};

export const config: QueueConfig = {
  indexFileQueue: {
    name: "index-file",
    concurrency: parseInt(process.env.INDEX_FILE_CONCURRENCY as string),
  },
  indexWebsiteQueue: {
    name: "index-website",
    concurrency: parseInt(process.env.INDEX_WEBSITE_CONCURRENCY as string),
  },
};

export default config;
