import type { Bindings, Variables } from '@api/types';
import { type WebhookEvent } from '@clerk/clerk-sdk-node';
import { Hono } from 'hono';
import { Stripe } from 'stripe';
import { Webhook } from 'svix';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>().post('/', async (c) => {
  // Get the Svix headers for verification
  const svix_id = c.req.header('svix-id');
  const svix_timestamp = c.req.header('svix-timestamp');
  const svix_signature = c.req.header('svix-signature');

  // If there are missing Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json(
      {
        message: 'Missing Svix headers'
      },
      400
    );
  }

  // Initiate Svix
  const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If the verification fails, error out and  return error code
  try {
    evt = wh.verify(await c.req.text(), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as WebhookEvent;
  } catch (err: unknown) {
    let message = 'Webhook failed to verify. Error: ';
    message += err instanceof Error ? err.message : JSON.stringify(err);
    // Console log and return error
    console.log('Webhook failed to verify. Error:', message);
    return c.json(
      {
        message
      },
      400
    );
  }

  switch (evt.type) {
    case 'user.updated':
    case 'user.created': {
      const { id, public_metadata } = evt.data;

      const user = await c.var.clerk.users.updateUserMetadata(id, {
        publicMetadata: {
          ...public_metadata,
          bibleTranslation: 'WEB',
          roles: ['user']
        }
      });

      if (!public_metadata.stripeCustomerId) {
        const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.create({
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            clerkId: user.id
          }
        });
        await c.var.clerk.users.updateUserMetadata(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
            stripeCustomerId: customer.id
          }
        });
      }

      break;
    }
    case 'user.deleted': {
      const { id } = evt.data;
      if (!id) {
        return c.json(
          {
            message: 'User ID not found in webhook data'
          },
          400
        );
      }
      break;
    }
    default: {
      return c.json(
        {
          message: 'Webhook event not recognized'
        },
        400
      );
    }
  }

  return c.json(
    {
      message: 'Webhook processed'
    },
    200
  );
});

export default app;
