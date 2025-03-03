import { createQuery } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';
import { getSubscription } from '../server/functions/pro';

export const useSubscription = () => {
  const query = createQuery(() => ({
    queryKey: ['user-subscription'],
    queryFn: () => getSubscription(),
    placeholderData: (prev) => prev ?? { subscription: null, type: 'free' as const },
  }));

  return {
    isActive: createMemo(
      () =>
        query.data?.subscription?.status === 'active' ||
        query.data?.subscription?.status === 'trialing',
    ),
    isPro: createMemo(() => query.data?.type === 'pro'),
    isMinistry: createMemo(() => query.data?.type === 'ministry'),
    subscription: createMemo(() => query.data?.subscription),
    refetch: query.refetch,
  };
};
