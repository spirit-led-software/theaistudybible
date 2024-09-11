import { createClerkClient } from '@clerk/clerk-sdk-node';
import { Resource } from 'sst';

export const clerk = createClerkClient({
  secretKey: Resource.ClerkSecretKey.value,
  publishableKey: Resource.ClerkPublishableKey.value,
});
