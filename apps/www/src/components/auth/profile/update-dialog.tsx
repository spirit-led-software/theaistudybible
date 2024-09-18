import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { type UpdateUser, UpdateUserSchema } from '@/schemas';
import { useAuth } from '@/www/contexts/auth';
import { auth } from '@/www/server/auth';
import { createForm, zodForm } from '@modular-forms/solid';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '../../ui/dialog';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from '../../ui/text-field';

async function updateUser(values: UpdateUser) {
  'use server';
  const { user } = auth();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const [updatedUser] = await db.update(users).set(values).where(eq(users.id, user.id)).returning();
  return updatedUser;
}

export const EditProfileDialog = () => {
  const { user, invalidate } = useAuth();

  const [toastId, setToastId] = createSignal<string | number>();
  const [open, setOpen] = createSignal(false);

  const [form, { Form, Field }] = createForm<z.infer<typeof UpdateUserSchema>>({
    validate: zodForm(UpdateUserSchema),
    initialValues: {
      email: user()?.email,
      firstName: user()?.firstName,
      lastName: user()?.lastName,
    },
  });

  const handleSubmit = createMutation(() => ({
    mutationFn: (values: UpdateUser) => updateUser(values),
    onMutate: () => {
      setToastId(toast.loading('Updating profile...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      invalidate();
      toast.dismiss(toastId());
      toast.success('Profile updated');
      setOpen(false);
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
  }));

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button}>Edit Profile</DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit Profile</DialogTitle>
        <Form class='flex flex-col gap-4' onSubmit={(data) => handleSubmit.mutateAsync(data)}>
          <Field name='email'>
            {(field, props) => (
              <TextField value={field.value} validationState={field.error ? 'invalid' : 'valid'}>
                <TextFieldLabel>Email</TextFieldLabel>
                <TextFieldInput {...props} type='email' />
                <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
              </TextField>
            )}
          </Field>
          <div class='flex w-full gap-2'>
            <Field name='firstName'>
              {(field, props) => (
                <TextField
                  value={field.value || undefined}
                  validationState={field.error ? 'invalid' : 'valid'}
                  class='w-full'
                >
                  <TextFieldLabel>First Name</TextFieldLabel>
                  <TextFieldInput {...props} type='text' />
                  <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
                </TextField>
              )}
            </Field>
            <Field name='lastName'>
              {(field, props) => (
                <TextField
                  value={field.value || undefined}
                  validationState={field.error ? 'invalid' : 'valid'}
                  class='w-full'
                >
                  <TextFieldLabel>Last Name</TextFieldLabel>
                  <TextFieldInput {...props} type='text' />
                  <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
                </TextField>
              )}
            </Field>
          </div>
          <DialogFooter>
            <Button type='submit' disabled={form.submitting || form.validating}>
              Save
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
