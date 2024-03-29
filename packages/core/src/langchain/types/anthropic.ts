export const anthropicModelIds = [
    'claude-instant-1.2',
    'claude-2.0',
    'claude-2.1',
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229'
  ] as const;
  export type AnthropicModelId = (typeof anthropicModelIds)[number];