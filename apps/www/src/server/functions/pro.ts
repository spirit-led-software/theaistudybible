import { getStripeData } from '@/core/stripe/utils';
import { GET } from '@solidjs/start';
import { auth } from '../utils/auth';

export const getProSubscription = GET(async () => {
  'use server';
  const { user } = auth();
  if (!user || !user.stripeCustomerId) return { subscription: null };
  const subData = await getStripeData(user.stripeCustomerId);
  return { subscription: subData };
});
