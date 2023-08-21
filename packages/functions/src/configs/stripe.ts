export type StripeConfig = {
  apiKey: string;
};

export const config: StripeConfig = {
  apiKey: process.env.STRIPE_API_KEY!,
};

export default config;
