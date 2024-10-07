import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { useAuth } from '@/www/contexts/auth';
import { auth } from '@/www/server/auth';
import { useNavigate } from '@solidjs/router';
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

async function deleteUser() {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('Unauthorized');
  }

  await db.delete(users).where(eq(users.id, user.id));

  return { success: true };
}

export const DeleteProfileDialog = () => {
  const navigate = useNavigate();
  const { invalidate } = useAuth();

  const [toastId, setToastId] = createSignal<string | number>();
  const [open, setOpen] = createSignal(false);

  const handleDelete = createMutation(() => ({
    mutationFn: () => deleteUser(),
    onMutate: () => {
      setToastId(toast.loading('Deleting profile...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      navigate('/');
      invalidate();
      toast.dismiss(toastId());
      toast.success('Profile deleted');
      setOpen(false);
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
  }));

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button}>Delete Profile</DialogTrigger>
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
