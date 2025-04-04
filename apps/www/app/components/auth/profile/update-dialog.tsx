import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { UpdateUserSchema } from '@/schemas/users';
import type { UpdateUser } from '@/schemas/users/types';
import { useAuth } from '@/www/hooks/use-auth';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';

const updateUser = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(UpdateUserSchema)
  .handler(async ({ context, data }) => {
    const { user } = context;
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, user.id)).returning();
    return { user: updatedUser };
  });

export const EditProfileDialog = () => {
  const { user, refetch } = useAuth();

  const [toastId, setToastId] = useState<string | number>();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof UpdateUserSchema>>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
    },
  });

  const handleSubmit = useMutation({
    mutationFn: (values: UpdateUser) => updateUser({ data: values }),
    onMutate: () => {
      setToastId(toast.loading('Updating profile...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId);
      toast.success('Profile updated');
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
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit Profile</DialogTitle>
        <Form {...form}>
          <form
            className='flex flex-col gap-4'
            onSubmit={form.handleSubmit((values) => handleSubmit.mutate(values))}
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex w-full gap-2'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? undefined} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? undefined} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type='submit'
                disabled={form.formState.isSubmitting || form.formState.isLoading}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
