import { InternalServerErrorResponse, OkResponse } from '@lib/api-responses';
import { getMostAskedUserMessages } from '@services/user/message';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const searchParams = event.queryStringParameters ?? {};
  const count = parseInt(searchParams.count ?? '10');

  try {
    const messages = await getMostAskedUserMessages(count);
    return OkResponse(messages.map((message) => message.text));
  } catch (error) {
    console.error('Error getting most sent user messages:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
