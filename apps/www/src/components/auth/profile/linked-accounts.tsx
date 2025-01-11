import { cache } from '@/core/cache';
import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { toTitleCase } from '@/core/utils/string';
import { useAuth } from '@/www/contexts/auth';
import { requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { Apple, X } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Google } from '../../ui/brand-icons';
import { Button } from '../../ui/button';
import { GradientH3 } from '../../ui/typography';

type Provider = 'google' | 'apple';

const unlinkAction = action(async (provider: Provider) => {
  'use server';
  const { session, user } = requireAuth();
  if (provider === 'google') {
    await db.update(users).set({ googleId: null }).where(eq(users.id, user.id));
  } else if (provider === 'apple') {
    await db.update(users).set({ appleId: null }).where(eq(users.id, user.id));
  } else {
    throw new Error(`Invalid provider: ${provider}`);
  }
  await cache.del(`auth:${session.id}`); // invalidate auth cache
  return { success: true };
});

export const LinkedAccounts = () => {
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
    <div class='flex flex-col items-center gap-2'>
      <GradientH3>Linked Accounts</GradientH3>
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
    </div>
  );
};
