import {
  CreatedResponse,
  InternalServerErrorResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { createDataSource } from '@services/data-source';
import { validApiHandlerSession } from '@services/session';
import { isAdminSync } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const data = JSON.parse(event.body ?? '{}');
  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }
    const dataSource = await createDataSource({
      ...data,
      userId: userWithRoles.id
    });
    return CreatedResponse(dataSource);
  } catch (error) {
    console.error('Error creating data source:', error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
