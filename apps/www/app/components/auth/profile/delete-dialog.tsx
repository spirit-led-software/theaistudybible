import { lucia } from '@/core/auth';
import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { stripe } from '@/core/stripe';
import { getStripeData } from '@/core/stripe/utils';
import { useAuth } from '@/www/hooks/use-auth';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';

const deleteUser = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    if (context.user.stripeCustomerId) {
      const subData = await getStripeData(context.user.stripeCustomerId);
      if (subData?.status === 'active') {
        await stripe.subscriptions.update(subData.subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    }
    await db.delete(users).where(eq(users.id, context.user.id));
    const cookie = lucia.cookies.createBlankSessionCookie();
    throw redirect({ to: '/', headers: { 'Set-Cookie': cookie.serialize() } });
  });

export const DeleteProfileDialog = () => {
  const { refetch } = useAuth();

  const [toastId, setToastId] = useState<string | number>();
  const [open, setOpen] = useState(false);

  const handleDelete = useMutation({
    mutationFn: () => deleteUser(),
    onMutate: () => {
      setToastId(toast.loading('Deleting profile...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId);
      toast.success('Profile deleted');
      setOpen(false);
      return refetch();
    },
    onError: (error) => {
      toast.dismiss(toastId);
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='destructive'>Delete Profile</Button>
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
