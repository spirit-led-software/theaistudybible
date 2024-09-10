import { clerk } from '@/core/clerk';
import { stripe } from '@/core/stripe';
import type { WebhookEvent } from '@clerk/clerk-sdk-node';
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
      const { id, public_metadata } = evt.data;

      const user = await clerk.users.updateUserMetadata(id, {
        publicMetadata: {
          ...public_metadata,
          bibleTranslation: 'WEB',
          roles: ['user'],
        },
      });

      if (!public_metadata.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            clerkId: user.id,
          },
        });
        await clerk.users.updateUserMetadata(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
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
