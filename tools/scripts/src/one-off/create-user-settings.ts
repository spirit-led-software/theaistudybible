import { db } from '@/core/database';
import { userSettings } from '@/core/database/schema';

export const createUserSettings = async () => {
  const users = await db.query.users.findMany({});
  await db
    .insert(userSettings)
    .values(users.map((user) => ({ userId: user.id })))
    .onConflictDoNothing(); // Ignore if the user already has settings
};
