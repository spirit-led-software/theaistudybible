import { InternalServerErrorResponse, OkResponse } from '@lib/api-responses';
import { getUserByStripeCustomerId } from '@services/user';
import { ApiHandler } from 'sst/node/api';
import Stripe from 'stripe';
import { stripeConfig } from '../configs';

const stripe = new Stripe(stripeConfig.apiKey, {
  apiVersion: '2023-10-16'
});

export const handler = ApiHandler(async (event) => {
  console.log(`Stripe webhook received: ${JSON.stringify(event)}`);

  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    console.error(err);
    return InternalServerErrorResponse((err as Error).message);
  }

  try {
    switch (stripeEvent.type) {
      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        console.log('Subscription created: ', subscription);

        const user = await getUserByStripeCustomerId(subscription.customer.toString());
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
  } catch (err: unknown) {
    console.error(err);
    return InternalServerErrorResponse((err as Error).message);
  }
});
