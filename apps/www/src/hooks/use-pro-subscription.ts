import { type SubscriptionData, getStripeData } from '@/core/stripe/utils';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { createEffect, createSignal } from 'solid-js';
import { auth } from '../server/auth';

const getSubscription = GET(async () => {
  'use server';
  const { user } = auth();
  if (!user || !user.stripeCustomerId) return { subscription: null };
  const subData = await getStripeData(user.stripeCustomerId);
  return { subscription: subData };
});

export const useProSubscription = () => {
  const [subscription, setSubscription] = createSignal<SubscriptionData | null>(null);

  const query = createQuery(() => ({
    queryKey: ['user-subscription'],
    queryFn: () => getSubscription(),
  }));

  createEffect(() => {
    if (query.status === 'success') {
      setSubscription(query.data.subscription);
    }
  });

  return {
    hasPro: () => subscription()?.status === 'active',
    subscription,
    refetch: query.refetch,
  };
};
