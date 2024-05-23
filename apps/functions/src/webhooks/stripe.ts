import { clerkClient } from '@theaistudybible/server/lib/user';
import { ApiHandler } from 'sst/node/api';
import Stripe from 'stripe';
import { BadRequestResponse, InternalServerErrorResponse, OkResponse } from '../lib/api-responses';

const stripe = new Stripe(process.env.STRIPE_API_KEY);

export const handler = ApiHandler(async (event) => {
  console.log(`Stripe webhook event received: ${JSON.stringify(event)}`);

  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return BadRequestResponse(`Error: ${err.message}\n${err.stack}`);
    }
    return BadRequestResponse(`Error: ${JSON.stringify(err)}`);
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        console.log('Checkout session completed: ', session);

        const clientReferenceId = session.client_reference_id;
        if (!clientReferenceId) {
          return BadRequestResponse('Missing client reference ID');
        }

        const user = await clerkClient.users.getUser(clientReferenceId);
        if (!user) {
          console.error(`User not found for client reference ID: ${clientReferenceId}`);
          return InternalServerErrorResponse(
            `User not found for client reference ID: ${clientReferenceId}`
          );
        }

        const stripeCustomerId = session.customer;
        if (
          stripeCustomerId &&
          typeof stripeCustomerId === 'string' &&
          user.publicMetadata.stripeCustomerId !== stripeCustomerId
        ) {
          await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              stripeCustomerId
            }
          });
        }

        return OkResponse();
      }
      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object;
        console.log('Subscription created: ', subscription);

        const sr = await stripe.customers.retrieve(subscription.customer.toString());
        if (sr.deleted) {
          console.log('Customer is deleted');
          return BadRequestResponse('Customer is deleted');
        }

        const user = await clerkClient.users.getUser(sr.metadata.clerkId);
        if (!user) {
          console.error(`User not found for Stripe customer ID: ${subscription.customer}`);
          return InternalServerErrorResponse(
            `User not found for Stripe customer ID: ${subscription.customer}`
          );
        }

        // Send token to revenue cat
        const response = await fetch('https://api.revenuecat.com/v1/receipts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.REVENUECAT_STRIPE_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Platform': 'stripe'
          },
          body: JSON.stringify({
            app_user_id: user.id,
            fetch_token: subscription.id
          })
        });

        if (!response.ok) {
          console.error(
            `Failed to send token to RevenueCat: ${response.status} ${response.statusText}`
          );
          return InternalServerErrorResponse(
            `Failed to send token to RevenueCat: ${response.status} ${response.statusText}`
          );
        }

        return OkResponse();
      }
      default: {
        console.warn(`Unhandled event type: ${stripeEvent.type}`);
      }
    }
    return OkResponse();
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return InternalServerErrorResponse(`Error: ${err.message}\n${err.stack}`);
    }
    return InternalServerErrorResponse(`Error: ${JSON.stringify(err)}`);
  }
});
