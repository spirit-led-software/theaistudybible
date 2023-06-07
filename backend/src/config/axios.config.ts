import { default as axiosBase } from 'axios';
import axiosRetry from 'axios-retry';

export const axios = axiosBase.create({});

axiosRetry(axios, {
  retries: 5, // Number of retries
  retryDelay: (retryCount) => retryCount * 1000, // Delay between retries in milliseconds
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error), // Retry only on specific errors
});
