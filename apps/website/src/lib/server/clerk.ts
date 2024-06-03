import { createClerkClient } from '@clerk/clerk-sdk-node';

export const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
