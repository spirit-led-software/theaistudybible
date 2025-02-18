import { Resource } from 'sst';
import Stripe from 'stripe';

let currentStripe: Stripe | undefined;
export const stripe = () => {
  if (!currentStripe) {
    currentStripe = new Stripe(Resource.StripeSecretKey.value);
  }
  return currentStripe;
};
