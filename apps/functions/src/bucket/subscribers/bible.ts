import type { S3Handler } from 'aws-lambda';

export const handler: S3Handler = (event) => {
  console.log(event);
};
