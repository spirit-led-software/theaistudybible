import { User } from "@core/model";
import {
  getUserByEmail,
  getUserByStripeCustomerId,
  updateUser,
} from "@services/user";
import { ApiHandler } from "sst/node/api";
import Stripe from "stripe";

const stripe = require("stripe")(process.env.STRIPE_API_KEY!) as Stripe;

const validateUser = async (
  email?: string,
  customerId?: string
): Promise<
  | {
      isValid: false;
      user?: User;
    }
  | {
      isValid: true;
      user: User;
    }
> => {
  if (!email && !customerId) {
    return { isValid: false };
  }

  let user: User | undefined;
  if (email) {
    user = await getUserByEmail(email);
  }
  if (!user && customerId) {
    user = await getUserByStripeCustomerId(customerId);
  }

  if (!user) {
    return { isValid: false };
  }

  return { isValid: true, user };
};

const fulfillOrder = async (
  item: Stripe.LineItem | Stripe.SubscriptionItem,
  user: User
) => {
  // Serve staff plan - 50 queries per day
  if (item.price?.product === "prod_OMn5NPjXcAqi4t") {
    await updateUser(user.id, {
      maxQueryCount: 50,
    });
  }
  // Youth Pastor plan - 100 queries per day
  else if (item.price?.product === "prod_OMnEB3M89FhxAU") {
    await updateUser(user.id, {
      maxQueryCount: 100,
    });
  }
  // Worship leader plan - 250 queries per day
  else if (item.price?.product === "prod_OMnFtE1Y58Fk3s") {
    await updateUser(user.id, {
      maxQueryCount: 250,
    });
  }
  // Lead pastor plan - 500 queries per day
  else if (item.price?.product === "prod_OMnFfbim0KFFpo") {
    await updateUser(user.id, {
      maxQueryCount: 500,
    });
  }
  // Church plant plan - unlimited queries per day
  else if (item.price?.product === "prod_OMnGHj22JmMhxm") {
    await updateUser(user.id, {
      maxQueryCount: Infinity,
    });
  } else {
    console.error(`Unknown product: ${item.price?.product}`);
  }
};

export const handler = ApiHandler(async (event, context) => {
  const sig = event.headers["stripe-signature"];

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const checkoutSession = stripeEvent.data
        .object as Stripe.Checkout.Session;

      console.log("Checkout complete!", checkoutSession);

      const email =
        checkoutSession.customer_email ??
        checkoutSession.customer_details?.email ??
        undefined;
      const customerId = checkoutSession.customer?.toString();

      const { isValid, user } = await validateUser(email, customerId);
      if (!isValid) {
        console.error(
          `User not found for email: ${email} or customer id: ${customerId}`
        );
        await stripe.refunds.create({
          payment_intent: checkoutSession.payment_intent?.toString(),
        });
        return {
          statusCode: 400,
          body: `User not found for email: ${email} or customer id: ${customerId}`,
        };
      }

      if (customerId && user.stripeCustomerId !== customerId) {
        await updateUser(user.id, {
          stripeCustomerId: customerId,
        });
      }

      if (checkoutSession.payment_status === "paid") {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          checkoutSession.id,
          {
            limit: 1,
          }
        );

        const lineItem = lineItems.data[0];

        await fulfillOrder(lineItem, user);
      }

      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const checkoutSession = stripeEvent.data
        .object as Stripe.Checkout.Session;

      console.log("Async payment succeeded!", checkoutSession);

      const email =
        checkoutSession.customer_email ??
        checkoutSession.customer_details?.email ??
        undefined;
      const customerId = checkoutSession.customer?.toString();

      const { isValid, user } = await validateUser(email, customerId);
      if (!isValid) {
        console.error(
          `User not found for email: ${email} or customer id: ${customerId}`
        );
        await stripe.refunds.create({
          payment_intent: checkoutSession.payment_intent?.toString(),
        });
        return {
          statusCode: 400,
          body: `User not found for email: ${email} or customer id: ${customerId}`,
        };
      }

      if (customerId && user.stripeCustomerId !== customerId) {
        await updateUser(user.id, {
          stripeCustomerId: customerId,
        });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        checkoutSession.id,
        {
          limit: 1,
        }
      );
      const lineItem = lineItems.data[0];
      await fulfillOrder(lineItem, user);

      break;
    }
    case "customer.subscription.updated": {
      const subscriptionUpdate = stripeEvent.data.object as Stripe.Subscription;

      console.log("Subscription schedule updated!", subscriptionUpdate);

      const customerId = subscriptionUpdate.customer.toString();
      const { isValid, user } = await validateUser(undefined, customerId);
      if (!isValid) {
        console.error(`User not found for customer id: ${customerId}`);
        return {
          statusCode: 400,
          body: `User not found for customer id: ${customerId}`,
        };
      }

      if (subscriptionUpdate.status === "active") {
        const subItem = subscriptionUpdate.items.data[0];
        await fulfillOrder(subItem, user);
      } else {
        await updateUser(user.id, {
          maxQueryCount: 25,
        });
      }

      break;
    }
    default: {
      console.warn(`Unhandled event type: ${stripeEvent.type}`);

      break;
    }
  }

  return {
    statusCode: 200,
    body: "Stripe Webhook Received",
  };
});
