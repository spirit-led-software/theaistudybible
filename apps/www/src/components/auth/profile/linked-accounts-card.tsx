import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { toTitleCase } from '@/core/utils/string';
import { useAuth } from '@/www/contexts/auth';
import { requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { X } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Apple, Google } from '../../ui/brand-icons';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { P } from '../../ui/typography';

type Provider = 'google' | 'apple';

const unlinkAction = action(async (provider: Provider) => {
  'use server';
  const { user } = requireAuth();
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
  const unlink = useAction(unlinkAction);
  const { user, refetch } = useAuth();

  const [toastId, setToastId] = createSignal<string | number>();

  const handleUnlink = createMutation(() => ({
    mutationFn: (provider: Provider) => unlink(provider),
    onMutate: (provider) => {
      setToastId(
        toast.loading(`Unlinking ${toTitleCase(provider)} account...`, {
          duration: Number.MAX_SAFE_INTEGER,
        }),
      );
    },
    onSuccess: (_, provider) => {
      toast.dismiss(toastId());
      toast.success(`${toTitleCase(provider)} account unlinked`);
    },
    onError: (e) => {
      toast.dismiss(toastId());
      toast.error(`Failed to unlink account: ${e.message}`);
    },
    onSettled: () => refetch(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
        <CardDescription>
          Manage your linked accounts to easily sign in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Show
          when={user()?.googleId || user()?.appleId}
          fallback={<P>You do not have any linked accounts</P>}
        >
          <div class='flex flex-wrap gap-2'>
            <Show when={user()?.googleId}>
              <Button variant='outline' onClick={() => handleUnlink.mutate('google')}>
                <Google class='mr-2 size-4' />
                Google
                <X class='ml-2 size-4' />
              </Button>
            </Show>
            <Show when={user()?.appleId}>
              <Button variant='outline' onClick={() => handleUnlink.mutate('apple')}>
                <Apple class='mr-2 size-4' />
                Apple
                <X class='ml-2 size-4' />
              </Button>
            </Show>
          </div>
        </Show>
      </CardContent>
    </Card>
  );
};
