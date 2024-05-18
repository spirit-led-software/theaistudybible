import { allModels } from '@revelationsai/core/model/llm';
import { ApiHandler } from 'sst/node/api';
import { InternalServerErrorResponse, OkResponse } from '../../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  console.log('Received language models request event', event);

  try {
    return OkResponse(allModels);
  } catch (error) {
    console.error('Error getting language models:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
