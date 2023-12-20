import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse
} from '@lib/api-responses';
import {
  addRoleToUser,
  doesUserHaveRole,
  getRoleByName,
  getRolesByUserId,
  removeRoleFromUser
} from '@services/role';
import { getUser } from '@services/user';
import { ApiHandler } from 'sst/node/api';

// https://www.revenuecat.com/docs/event-types-and-fields
type RootEventObject = {
  api_version: string;
  event: Event;
};

type Event = {
  aliases: string[];
  app_id: string;
  app_user_id: string;
  commission_percentage: number;
  country_code: string;
  currency: string;
  entitlement_ids: string[];
  environment: string;
  event_timestamp_ms: number;
  expiration_at_ms: number;
  id: string;
  is_family_share: boolean;
  offer_code: string;
  original_app_user_id: string;
  original_transaction_id: string;
  period_type: string;
  presented_offering_id: string;
  price: number;
  price_in_purchased_currency: number;
  product_id: string;
  purchased_at_ms: number;
  store: string;
  subscriber_attributes: unknown;
  takehome_percentage: number;
  tax_percentage: number;
  transaction_id: string;
  type:
    | 'TEST'
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'NON_RENEWING_PURCHASE'
    | 'SUBSCRIPTION_PAUSED'
    | 'EXPIRATION'
    | 'BILLING_ISSUE'
    | 'PRODUCT_CHANGE'
    | 'TRANSFER'
    | 'SUBSCRIBER_ALIAS';
};

export const handler = ApiHandler(async (event) => {
  console.log('Received Revenue Cat event: ', event);

  const authHeader = event.headers['authorization'];
  if (!authHeader) {
    return UnauthorizedResponse();
  } else {
    const [authType, authKey] = authHeader.split(' ');
    if (authType !== 'Bearer') {
      return BadRequestResponse('Invalid authorization header');
    } else if (authKey !== process.env.REVENUECAT_WEBHOOK_SECRET) {
      return ForbiddenResponse();
    } else {
      console.log('Authorized Revenue Cat webhook');
    }
  }

  if (!event.body) {
    return BadRequestResponse('Missing body');
  }

  const body: RootEventObject = JSON.parse(event.body);

  if (body.api_version !== '1.0') {
    return BadRequestResponse('Invalid API version');
  }

  try {
    const eventObj = body.event;
    if (eventObj.type === 'INITIAL_PURCHASE' || eventObj.type === 'RENEWAL') {
      console.log('Purchase event: ', eventObj);
      const user = await getUser(eventObj.app_user_id);
      if (!user) {
        return BadRequestResponse('User not found');
      }

      // Remove all existing RC roles
      await getRolesByUserId(user.id).then(async (roles) => {
        for (const role of roles) {
          if (role.name.startsWith('rc:')) {
            await removeRoleFromUser(role.name, user.id);
          }
        }
      });

      // Add new RC roles
      for (const entitlementId of eventObj.entitlement_ids) {
        const role = await getRoleByName(`rc:${entitlementId}`);
        if (!role) {
          return BadRequestResponse('Role not found');
        }
        await doesUserHaveRole(role.name, user.id).then(async (hasRole) => {
          if (!hasRole) {
            await addRoleToUser(role.name, user.id);
          }
        });
      }
    } else if (eventObj.type === 'EXPIRATION') {
      console.log('Expiration event: ', eventObj);
      const user = await getUser(eventObj.app_user_id);
      if (!user) {
        return BadRequestResponse('User not found');
      }

      // Remove all RC roles
      await getRolesByUserId(user.id).then(async (roles) => {
        for (const role of roles) {
          if (role.name.startsWith('rc:')) {
            await removeRoleFromUser(role.name, user.id);
          }
        }
      });
    } else if (eventObj.type === 'TEST') {
      console.log('Test event: ', eventObj);
    } else {
      console.log('Unhandled event type: ', eventObj.type);
    }

    return OkResponse();
  } catch (error: unknown) {
    console.error(error);
    return InternalServerErrorResponse((error as Error).message);
  }
});
