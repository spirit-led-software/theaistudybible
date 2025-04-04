import { getStripeData } from '@/core/stripe/utils';
import { createServerFn } from '@tanstack/react-start';
import { Resource } from 'sst';
import { authMiddleware } from '../middleware/auth';

export const getSubscription = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    let type: 'pro' | 'ministry' | 'free' = 'free';
    if (!context.user || !context.user.stripeCustomerId) return { subscription: null, type };

    const subData = await getStripeData(context.user.stripeCustomerId);
    if (subData.status === 'active' || subData.status === 'trialing') {
      if (subData.productId === Resource.ProSubProduct.id) {
        type = 'pro';
      } else if (subData.productId === Resource.MinistrySubProduct.id) {
        type = 'ministry';
      }
    }
    return { subscription: subData, type };
  });
