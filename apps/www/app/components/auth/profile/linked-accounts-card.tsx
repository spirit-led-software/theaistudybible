import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { toTitleCase } from '@/core/utils/string';
import { useAuth } from '@/www/hooks/use-auth';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Apple, Google } from '../../ui/brand-icons';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { P } from '../../ui/typography';

type Provider = 'google' | 'apple';

const unlink = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      provider: z.enum(['google', 'apple']),
    }),
  )
  .handler(async ({ context, data }) => {
    const { user } = context;
    const { provider } = data;
    if (provider === 'google') {
      await db.update(users).set({ googleId: null }).where(eq(users.id, user.id));
    } else if (provider === 'apple') {
      await db.update(users).set({ appleId: null }).where(eq(users.id, user.id));
    } else {
      throw new Error(`Invalid provider: ${provider}`);
    }
    return { success: true };
  });

export const LinkedAccountsCard = () => {
  const { user, refetch } = useAuth();

  const [toastId, setToastId] = useState<string | number>();

  const handleUnlink = useMutation({
    mutationFn: (provider: Provider) => unlink({ data: { provider } }),
    onMutate: (provider) => {
      setToastId(
        toast.loading(`Unlinking ${toTitleCase(provider)} account...`, {
          duration: Number.MAX_SAFE_INTEGER,
        }),
      );
    },
    onSuccess: (_, provider) => {
      toast.dismiss(toastId);
      toast.success(`${toTitleCase(provider)} account unlinked`);
    },
    onError: (e) => {
      toast.dismiss(toastId);
      toast.error(`Failed to unlink account: ${e.message}`);
    },
    onSettled: () => refetch(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
        <CardDescription>
          Manage your linked accounts to easily sign in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user?.googleId || user?.appleId ? (
          <div className='flex flex-wrap gap-2'>
            {user?.googleId && (
              <Button variant='outline' onClick={() => handleUnlink.mutate('google')}>
                <Google className='mr-2 size-4' />
                Google
                <X className='ml-2 size-4' />
              </Button>
            )}
            {user?.appleId && (
              <Button variant='outline' onClick={() => handleUnlink.mutate('apple')}>
                <Apple className='mr-2 size-4' />
                Apple
                <X className='ml-2 size-4' />
              </Button>
            )}
          </div>
        ) : (
          <P>You do not have any linked accounts</P>
        )}
      </CardContent>
    </Card>
  );
};
