export const googleModelIds = ['gemini-pro', 'gemini-vision-pro'] as const;
export type GoogleModelId = (typeof googleModelIds)[number];
