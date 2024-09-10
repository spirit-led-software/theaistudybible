import { generateDevotion } from '@/ai/devotion';

export const handler = async () => {
  await generateDevotion();
};
