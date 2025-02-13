import type { SubscriptionData } from '@/core/stripe/types';
import { createQuery } from '@tanstack/solid-query';
import { createEffect, createSignal } from 'solid-js';
import { getProSubscription } from '../server/functions/pro';

export const useProSubscription = () => {
  const [subscription, setSubscription] = createSignal<SubscriptionData | null>(null);

  const query = createQuery(() => ({
    queryKey: ['user-subscription'],
    queryFn: () => getProSubscription(),
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
