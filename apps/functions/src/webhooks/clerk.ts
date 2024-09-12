import { clerk } from '@/core/clerk';
import { stripe } from '@/core/stripe';
import type { User, WebhookEvent } from '@clerk/clerk-sdk-node';
import { Hono } from 'hono/quick';
import { Resource } from 'sst';
import { Webhook } from 'svix';

const app = new Hono().post('/', async (c) => {
  // Get the Svix headers for verification
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  // If there are missing Svix headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json(
      {
        message: 'Missing Svix headers',
      },
      400,
    );
  }

  // Initiate Svix
  const wh = new Webhook(Resource.ClerkWebhookSecret.value);

  let evt: WebhookEvent;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If the verification fails, error out and  return error code
  try {
    evt = wh.verify(await c.req.text(), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err: unknown) {
    let message = 'Webhook failed to verify. Error: ';
    message += err instanceof Error ? err.message : JSON.stringify(err);
    // Console log and return error
    console.log('Webhook failed to verify. Error:', message);
    return c.json(
      {
        message,
      },
      400,
    );
  }

  switch (evt.type) {
    case 'user.updated':
    case 'user.created': {
      const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

      let user: User | undefined;
      if (!('bibleTranslation' in public_metadata)) {
        user = await clerk.users.updateUserMetadata(id, {
          publicMetadata: {
            ...public_metadata,
            bibleTranslation: 'WEB',
          },
        });
      }

      if (!('roles' in public_metadata)) {
        user = await clerk.users.updateUserMetadata(id, {
          publicMetadata: {
            ...public_metadata,
            // biome-ignore lint/suspicious/noExplicitAny: We know what type this is
            roles: Array.from(new Set([...((public_metadata as any)?.roles ?? []), 'user'])),
          },
        });
      }

      if (!('stripeCustomerId' in public_metadata)) {
        const customer = await stripe.customers.create({
          email: email_addresses[0].email_address,
          name: `${first_name} ${last_name}`,
          metadata: {
            clerkId: id,
          },
        });
        await clerk.users.updateUserMetadata(id, {
          publicMetadata: {
            ...public_metadata,
            stripeCustomerId: customer.id,
          },
        });
      }

      break;
    }
    case 'user.deleted': {
      const { id } = evt.data;
      if (!id) {
        return c.json(
          {
            message: 'User ID not found in webhook data',
          },
          400,
        );
      }
      break;
    }
    default: {
      return c.json(
        {
          message: 'Webhook event not recognized',
        },
        400,
      );
    }
  }

  return c.json(
    {
      message: 'Webhook processed',
    },
    200,
  );
});

export default app;
