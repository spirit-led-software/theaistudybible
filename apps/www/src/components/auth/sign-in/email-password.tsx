import { signIn } from '@/core/auth/providers/credentials';
import { signInSchema } from '@/core/auth/providers/credentials/schemas';
import { createForm, zodForm } from '@modular-forms/solid';
import { A, action, redirect, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Eye, EyeOff } from 'lucide-solid';
import { Match, Switch, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { Button } from '../../ui/button';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from '../../ui/text-field';

const signInWithEmailPasswordAction = action(
  async (values: z.infer<typeof signInSchema>, redirectUrl = '/') => {
    'use server';
    const cookie = await signIn(values);
    throw redirect(redirectUrl, { headers: { 'Set-Cookie': cookie.serialize() } });
  },
);

type EmailPasswordFormProps = {
  redirectUrl?: string;
  onSuccess: () => void;
};

export const EmailPasswordForm = (props: EmailPasswordFormProps) => {
  const signInWithEmailPassword = useAction(signInWithEmailPasswordAction);
  const [form, { Form, Field }] = createForm<z.infer<typeof signInSchema>>({
    validate: zodForm(signInSchema),
  });

  const onSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      signInWithEmailPassword(values, props.redirectUrl),
    onSuccess: () => {
      props.onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const [showPassword, setShowPassword] = createSignal(false);

  return (
    <Form onSubmit={(values) => onSubmit.mutateAsync(values)} class='space-y-4'>
      <Field name='email'>
        {(field, props) => (
          <TextField
            value={field.value}
            validationState={field.error ? 'invalid' : 'valid'}
            class='w-full'
          >
            <TextFieldLabel class='text-sm sm:text-base'>Email</TextFieldLabel>
            <TextFieldInput
              {...props}
              type='email'
              autocomplete='email'
              class='w-full p-2 text-sm sm:text-base'
            />
            <TextFieldErrorMessage class='text-xs sm:text-sm'>{field.error}</TextFieldErrorMessage>
          </TextField>
        )}
      </Field>
      <Field name='password'>
        {(field, props) => (
          <TextField
            value={field.value}
            validationState={field.error ? 'invalid' : 'valid'}
            class='w-full'
          >
            <TextFieldLabel class='text-sm sm:text-base'>Password</TextFieldLabel>
            <div class='relative'>
              <TextFieldInput
                {...props}
                type={showPassword() ? 'text' : 'password'}
                autocomplete='current-password'
                class='w-full p-2 pr-10 text-sm sm:text-base'
              />
              <button
                type='button'
                tabIndex={-1}
                class='absolute inset-y-0 right-0 flex items-center pr-3'
                onClick={() => setShowPassword(!showPassword())}
              >
                <Switch>
                  <Match when={showPassword()}>
                    <EyeOff class='h-5 w-5 text-gray-400' />
                  </Match>
                  <Match when={!showPassword()}>
                    <Eye class='h-5 w-5 text-gray-400' />
                  </Match>
                </Switch>
              </button>
            </div>
            <TextFieldErrorMessage class='text-xs sm:text-sm'>{field.error}</TextFieldErrorMessage>
          </TextField>
        )}
      </Field>
      <div class='flex w-full flex-col items-center space-y-3'>
        <Button type='submit' disabled={form.validating || form.submitting} class='w-full'>
          Sign In
        </Button>
        <Button as={A} variant='link' href='/forgot-password' class='p-0 text-xs sm:text-sm'>
          Forgot Password?
        </Button>
      </div>
    </Form>
  );
};
