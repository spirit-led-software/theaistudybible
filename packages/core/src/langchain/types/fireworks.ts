export const mistralModelIds = ['accounts/fireworks/models/mixtral-8x7b-instruct'] as const;
export type MistralModelId = (typeof mistralModelIds)[number];

export const fireworksModelIds = [...mistralModelIds] as const;
export type FireworksModelId = (typeof fireworksModelIds)[number];
