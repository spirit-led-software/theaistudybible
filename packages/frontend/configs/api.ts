export type ApiConfig = {
  apiUrl: string;
  apiBasePath: string;
};

export const config: ApiConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL as string,
  apiBasePath: process.env.NEXT_PUBLIC_API_BASE_PATH as string,
};

export default config;
