import { SQSClient } from '@aws-sdk/client-sqs';

let currentSQS: SQSClient | undefined;
export const sqs = () => {
  if (!currentSQS) {
    currentSQS = new SQSClient({});
  }
  return currentSQS;
};
