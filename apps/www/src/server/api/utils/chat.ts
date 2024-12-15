import { advancedChatModels, basicChatModels } from '@/ai/models';
import type { Context } from 'hono';
import type { Bindings } from 'hono/types';
import { Resource } from 'sst';
import type { Variables } from '../types';

export function validateModelId({
  c,
  providedModelId,
}: {
  c: Context<{
    Bindings: Bindings;
    Variables: Variables;
  }>;
  providedModelId: string;
}): Response | undefined {
  const isBasicTier = basicChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  const isAdvancedTier = advancedChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  if (!isBasicTier && !isAdvancedTier) {
    console.log('Invalid modelId provided');
    c.json(
      {
        message: 'Invalid model ID provided',
      },
      400,
    );
  }
  if (isAdvancedTier && !c.var.roles?.some((role) => role.id === 'admin')) {
    return c.json(
      {
        message:
          'Your plan does not support this model. Please upgrade to a plan that supports this model.',
      },
      403,
    );
  }
  return undefined;
}

export function getDefaultModelId(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  return c.var.roles?.some((role) => role.id === 'admin')
    ? Resource.Stage.value === 'production'
      ? `${advancedChatModels[0].host}:${advancedChatModels[0].id}`
      : `${basicChatModels[0].host}:${basicChatModels[0].id}`
    : `${basicChatModels[0].host}:${basicChatModels[0].id}`;
}
