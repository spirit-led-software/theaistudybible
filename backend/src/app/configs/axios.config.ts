import { default as axiosBase } from 'axios';
import axiosRetry from 'axios-retry';

export const axios = axiosBase.create({
  'axios-retry': {
    retries: 5,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error),
  },
});

export default axios;
