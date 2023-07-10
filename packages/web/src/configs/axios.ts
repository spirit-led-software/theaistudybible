import { default as axiosBase } from "axios";
import axiosRetry from "axios-retry";

export const axios = axiosBase.create({
  "axios-retry": {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
  },
});

export default axios;
