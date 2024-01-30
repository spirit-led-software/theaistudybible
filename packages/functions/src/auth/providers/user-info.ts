import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { useHeader, usePath } from 'sst/node/api';
import { createAdapter } from 'sst/node/auth';
import { BadRequestResponse } from '../../lib/api-responses';

interface SessionConfig {
  onRefresh: (token: string) => Promise<APIGatewayProxyStructuredResultV2>;
  onError: (error: unknown) => Promise<APIGatewayProxyStructuredResultV2>;
}

export const SessionAdapter = createAdapter((config: SessionConfig) => {
  return async function () {
    const [step] = usePath().slice(-1);
    if (step === 'refresh') {
      try {
        const token = useHeader('authorization')?.split(' ')[1];
        if (!token) {
          return BadRequestResponse('Authorization token is required');
        }
        return config.onRefresh(token);
      } catch (error) {
        return config.onError(error);
      }
    } else {
      return BadRequestResponse('Invalid step');
    }
  };
});
