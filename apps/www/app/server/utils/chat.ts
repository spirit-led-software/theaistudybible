import { advancedChatModels, basicChatModels } from '@/ai/models';
import { cache } from '@/core/cache';
import { getStripeData, isMinistry, isPro } from '@/core/stripe/utils';
import type { Role } from '@/schemas/roles/types';
import type { User } from '@/schemas/users/types';
import { Ratelimit } from '@upstash/ratelimit';

export async function getChatRateLimit(user: User, roles?: Role[] | null) {
  const rlPrefix = 'chat';
  const subData = await getStripeData(user.stripeCustomerId);
  if (isPro(subData)) {
    return new Ratelimit({
      prefix: rlPrefix,
      redis: cache,
      limiter: Ratelimit.slidingWindow(100, '24h'),
    });
  }

  if (isMinistry(subData) || roles?.some((role) => role.id === 'admin')) {
    return new Ratelimit({
      prefix: rlPrefix,
      redis: cache,
      limiter: Ratelimit.slidingWindow(Number.MAX_SAFE_INTEGER, '24h'),
    });
  }

  return new Ratelimit({
    prefix: rlPrefix,
    redis: cache,
    limiter: Ratelimit.slidingWindow(10, '24h'),
  });
}

export async function getChatSuggestionsRateLimit(user: User, roles?: Role[] | null) {
  const rlPrefix = 'chat-suggestions';
  const subData = await getStripeData(user.stripeCustomerId);
  if (isPro(subData)) {
    return new Ratelimit({
      prefix: rlPrefix,
      redis: cache,
      limiter: Ratelimit.slidingWindow(100 * 2, '24h'),
    });
  }

  if (isMinistry(subData) || roles?.some((role) => role.id === 'admin')) {
    return new Ratelimit({
      prefix: rlPrefix,
      redis: cache,
      limiter: Ratelimit.slidingWindow(Number.MAX_SAFE_INTEGER, '24h'),
    });
  }

  return new Ratelimit({
    prefix: rlPrefix,
    redis: cache,
    limiter: Ratelimit.slidingWindow(10 * 2, '24h'),
  });
}

export async function validateModelId({
  user,
  roles,
  providedModelId,
}: {
  user: User;
  roles?: Role[] | null;
  providedModelId: string;
}) {
  const isBasicTier = basicChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  const isAdvancedTier = advancedChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  if (!isBasicTier && !isAdvancedTier) {
    console.log('Invalid modelId provided');
    throw new Response('Invalid model ID provided', { status: 400 });
  }

  const subData = await getStripeData(user.stripeCustomerId);
  if (
    isAdvancedTier &&
    subData?.status !== 'active' &&
    !roles?.some((role) => role.id === 'admin')
  ) {
    throw new Response(
      'Your plan does not support this model. Please upgrade to pro to use this model.',
      { status: 403 },
    );
  }
}
