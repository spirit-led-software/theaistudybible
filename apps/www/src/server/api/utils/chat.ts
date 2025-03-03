import { advancedChatModels, basicChatModels } from '@/ai/models';
import { cache } from '@/core/cache';
import { getStripeData, isMinistry, isPro } from '@/core/stripe/utils';
import type { Role } from '@/schemas/roles/types';
import type { User } from '@/schemas/users/types';
import { Ratelimit } from '@upstash/ratelimit';
import type { Context } from 'hono';
import type { Bindings } from 'hono/types';
import type { Variables } from '../types';

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

export async function validateModelId({
  c,
  providedModelId,
}: {
  c: Context<{
    Bindings: Bindings;
    Variables: Variables;
  }>;
  providedModelId: string;
}): Promise<Response | undefined> {
  const isBasicTier = basicChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  const isAdvancedTier = advancedChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  if (!isBasicTier && !isAdvancedTier) {
    console.log('Invalid modelId provided');
    c.json({ message: 'Invalid model ID provided' }, 400);
  }

  const subData = await getStripeData(c.var.user!.stripeCustomerId);
  if (
    isAdvancedTier &&
    subData?.status !== 'active' &&
    !c.var.roles?.some((role) => role.id === 'admin')
  ) {
    return c.json(
      {
        message: 'Your plan does not support this model. Please upgrade to pro to use this model.',
      },
      403,
    );
  }
  return undefined;
}
