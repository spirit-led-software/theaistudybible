import type { Devotion } from '@core/model/devotion';
import {
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import { getDevotion, updateDevotion } from '@services/devotion';
import { validApiHandlerSession } from '@services/session';
import { isAdmin } from '@services/user';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(async (event) => {
  const id = event.pathParameters!.id!;
  const data = JSON.parse(event.body ?? '{}');

  try {
    let devo: Devotion | undefined = await getDevotion(id);
    if (!devo) {
      return ObjectNotFoundResponse(id);
    }

    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !(await isAdmin(userWithRoles.id))) {
      return UnauthorizedResponse();
    }

    devo = await updateDevotion(devo!.id, data);

    return OkResponse(devo);
  } catch (error) {
    console.error(`Error updating devotion '${id}':`, error);
    if (error instanceof Error) {
      return InternalServerErrorResponse(`${error.message}\n${error.stack}`);
    } else {
      return InternalServerErrorResponse(JSON.stringify(error));
    }
  }
});
