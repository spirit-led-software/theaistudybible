import { getStripeData } from '@/core/stripe/utils';
import { GET } from '@solidjs/start';
import { Resource } from 'sst';
import { auth } from '../utils/auth';

export const getSubscription = GET(async () => {
  'use server';
  const { user } = auth();
  let type: 'pro' | 'ministry' | 'free' = 'free';
  if (!user || !user.stripeCustomerId) return { subscription: null, type };

  const subData = await getStripeData(user.stripeCustomerId);
  if (subData.status === 'active' || subData.status === 'trialing') {
    if (subData.productId === Resource.ProSubProduct.id) {
      type = 'pro';
    } else if (subData.productId === Resource.MinistrySubProduct.id) {
      type = 'ministry';
    }
  }
  console.log('subData', subData);
  return { subscription: subData, type };
});
