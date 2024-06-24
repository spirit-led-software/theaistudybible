import { db } from '@theaistudybible/core/database';
import { clerkClient, userHasRole } from '@theaistudybible/core/user';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';

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

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>().post('/', async (c) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader) {
    return c.json({ message: 'Missing authorization header' }, 401);
  } else {
    const [authType, authKey] = authHeader.split(' ');
    if (authType !== 'Bearer') {
      return c.json({ message: 'Invalid authorization type' }, 401);
    } else if (authKey !== process.env.REVENUECAT_WEBHOOK_SECRET) {
      return c.json({ message: 'Invalid authorization key' }, 403);
    } else {
      console.log('Authorized Revenue Cat webhook');
    }
  }

  const body: RootEventObject | undefined = await c.req.json();
  if (!body) {
    return c.json({ message: 'Missing body' }, 400);
  }

  if (body.api_version !== '1.0') {
    return c.json({ message: 'Invalid API version' }, 400);
  }

  const eventObj = body.event;
  if (eventObj.type === 'INITIAL_PURCHASE' || eventObj.type === 'RENEWAL') {
    console.log('Purchase event: ', eventObj);
    const user = await clerkClient.users.getUser(eventObj.app_user_id);
    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    // Remove all existing RC roles
    const newRoles: string[] = [];
    const roles = user.publicMetadata.roles;
    if (roles && Array.isArray(roles)) {
      for (const role of roles) {
        if (typeof role === 'string' && !role.startsWith('rc:')) {
          newRoles.push(role);
        }
      }
    }

    // Add new RC roles
    for (const entitlementId of eventObj.entitlement_ids) {
      const role = await db.query.roles.findFirst({
        where: (roles, { eq }) => eq(roles.id, `rc:${entitlementId}`)
      });
      if (!role) {
        return c.json({ message: 'Role not found' }, 404);
      }
      if (!userHasRole(role.name, user)) {
        newRoles.push(role.name);
      }
    }

    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: newRoles
      }
    });
  } else if (eventObj.type === 'EXPIRATION') {
    console.log('Expiration event: ', eventObj);
    const user = await clerkClient.users.getUser(eventObj.app_user_id);
    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    // Remove all RC roles
    const newRoles: string[] = [];
    const roles = user.publicMetadata.roles;
    if (roles && Array.isArray(roles)) {
      for (const role of roles) {
        if (typeof role === 'string' && !role.startsWith('rc:')) {
          newRoles.push(role);
        }
      }
    }

    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: newRoles
      }
    });
  } else if (eventObj.type === 'TEST') {
    console.log('Test event: ', eventObj);
  } else {
    console.log('Unhandled event type: ', eventObj.type);
  }

  return c.json({ message: 'Webhook received' });
});

export default app;
