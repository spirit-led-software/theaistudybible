export type ReplicateConfig = {
  apiKey: string;
  imageModel: `${string}/${string}:${string}`;
};

export const config: ReplicateConfig = {
  apiKey: process.env.REPLICATE_API_KEY!,
  imageModel: process.env.REPLICATE_IMAGE_MODEL as `${string}/${string}:${string}`
};

export default config;
