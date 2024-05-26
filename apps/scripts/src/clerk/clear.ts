import { createClerkClient } from '@clerk/clerk-sdk-node';

export async function clearClerkEnv({
  secretKey,
  allowProd
}: {
  secretKey: string;
  allowProd: boolean;
}) {
  if (secretKey.split('_')[1] === 'live' && !allowProd) {
    throw new Error(
      'The Clerk Secret Key provided is for a production instance. Please supply the --allow-prod flag to clear users from the production'
    );
  }

  console.log('Clearing Clerk users');
  const clerkClient = createClerkClient({
    secretKey
  });
  const userCount = await clerkClient.users.getCount();
  console.log(`Clearing ${userCount} users`);
  const users = await clerkClient.users.getUserList({
    limit: userCount
  });
  await Promise.all(users.data.map((user) => clerkClient.users.deleteUser(user.id)));
  console.log('Clerk users cleared');
}
