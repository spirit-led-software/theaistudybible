import { db } from '@/core/database';
import { userCredits, users } from '@/core/database/schema';
import { stripe } from '@/core/stripe';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono/quick';
import { Resource } from 'sst';
import type Stripe from 'stripe';

const app = new Hono().post('/', async (c) => {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature');
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig!, Resource.StripeWebhookSecret.value);
  } catch (err) {
    return c.json({ message: `Webhook Error: ${JSON.stringify(err)}` }, 400);
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object;
      console.log('Checkout session completed: ', session);

      const clientReferenceId = session.client_reference_id;
      if (!clientReferenceId) {
        return c.json({ message: 'Client reference ID not found' }, 400);
      }

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, clientReferenceId),
      });
      if (!user) {
        console.error(`User not found for client reference ID: ${clientReferenceId}`);
        return c.json({ message: 'User not found' }, 404);
      }

      let customer = session.customer;
      if (typeof customer === 'string') {
        customer = await stripe.customers.retrieve(customer);
      }
      if (customer && !customer.deleted && user.stripeCustomerId !== customer.id) {
        await db
          .update(users)
          .set({
            stripeCustomerId: customer.id,
          })
          .where(eq(users.id, user.id));
      }

      let product = session.line_items?.data[0].price?.product;
      if (!product) {
        return c.json({ message: 'Product not included in checkout session' }, 400);
      }

      if (typeof product === 'string') {
        product = await stripe.products.retrieve(product);
      }
      if (!product || product.deleted) {
        return c.json({ message: 'Invalid product' }, 400);
      }

      const credits = product.metadata.credits;
      if (!credits || typeof credits !== 'number') {
        return c.json({ message: 'Invalid credits in product metadata' }, 400);
      }

      await db
        .insert(userCredits)
        .values({
          userId: user.id,
          balance: credits,
        })
        .onConflictDoUpdate({
          target: [userCredits.userId],
          set: {
            balance: sql`${userCredits.balance} + ${credits}`,
          },
        })
        .returning();

      return c.json({ message: 'Checkout session completed' });
    }
    default: {
      console.warn(`Unhandled event type: ${stripeEvent.type}`);
    }
  }
  return c.json({ message: 'Unhandled event type' });
});

export default app;
