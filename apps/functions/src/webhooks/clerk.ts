import { type WebhookEvent } from '@clerk/clerk-sdk-node';
import { clerkClient } from '@theaistudybible/functions/lib/user';
import { ApiHandler } from 'sst/node/api';
import { Stripe } from 'stripe';
import { Webhook } from 'svix';
import { BadRequestResponse, OkResponse } from '../lib/api-responses';

export const handler = ApiHandler(async (event) => {
  // Get the Svix headers for verification
  const svix_id = event.headers['svix-id'];
  const svix_timestamp = event.headers['svix-timestamp'];
  const svix_signature = event.headers['svix-signature'];

  // If there are missing Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return BadRequestResponse('Missing Svix headers');
  }

  if (!event.body) {
    return BadRequestResponse('Missing event body');
  }

  // Initiate Svix
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If the verification fails, error out and  return error code
  try {
    evt = wh.verify(event.body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as WebhookEvent;
  } catch (err: unknown) {
    let message = 'Webhook failed to verify. Error: ';
    message += err instanceof Error ? err.message : JSON.stringify(err);
    // Console log and return error
    console.log('Webhook failed to verify. Error:', message);
    return BadRequestResponse(message);
  }

  switch (evt.type) {
    case 'user.updated':
    case 'user.created': {
      const { id, public_metadata } = evt.data;

      const user = await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          ...public_metadata,
          bibleTranslation: 'WEB',
          roles: ['user']
        }
      });

      if (!public_metadata.stripeCustomerId) {
        const stripe = new Stripe(process.env.STRIPE_API_KEY);
        const customer = await stripe.customers.create({
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            clerkId: user.id
          }
        });
        await clerkClient.users.updateUserMetadata(user.id, {
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
        return BadRequestResponse('User ID not found in webhook data');
      }
      break;
    }
    default:
      BadRequestResponse('Webhook event not recognized');
  }

  return OkResponse({
    message: 'Webhook processed'
  });
});
