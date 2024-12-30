import { lucia } from '@/core/auth/lucia';

export const cleanupSessions = async () => {
  await lucia.deleteExpiredSessions();
};
