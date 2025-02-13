import { lucia } from '@/core/auth';
import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { stripe } from '@/core/stripe';
import { getStripeData } from '@/core/stripe/utils';
import { useAuth } from '@/www/contexts/auth';
import { requireAuth } from '@/www/server/utils/auth';
import { action, redirect, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';

const deleteUserAction = action(async () => {
  'use server';
  const { user } = requireAuth();
  if (user.stripeCustomerId) {
    const subData = await getStripeData(user.stripeCustomerId);
    if (subData?.status === 'active') {
      await stripe.subscriptions.update(subData.subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }
  await db.delete(users).where(eq(users.id, user.id));
  const cookie = lucia.cookies.createBlankSessionCookie();
  return redirect('/', { headers: { 'Set-Cookie': cookie.serialize() } });
});

export const DeleteProfileDialog = () => {
  const deleteUser = useAction(deleteUserAction);

  const { refetch } = useAuth();

  const [toastId, setToastId] = createSignal<string | number>();
  const [open, setOpen] = createSignal(false);

  const handleDelete = createMutation(() => ({
    mutationFn: () => deleteUser(),
    onMutate: () => {
      setToastId(toast.loading('Deleting profile...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId());
      toast.success('Profile deleted');
      setOpen(false);
      return refetch();
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
  }));

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button} variant='destructive'>
        Delete Profile
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete your account? This action cannot be undone.
        </DialogDescription>
        <DialogFooter>
          <Button onClick={() => handleDelete.mutateAsync()}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
