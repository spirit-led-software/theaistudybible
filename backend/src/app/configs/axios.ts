import { CreateAxiosDefaults, default as axiosBase } from 'axios';
import axiosRetry from 'axios-retry';

export const config: CreateAxiosDefaults<any> = {
  'axios-retry': {
    retries: 5,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error),
  },
};

export const axios = axiosBase.create(config);

export default config;
