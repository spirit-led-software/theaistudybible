import { signUp } from '@/core/auth/providers/credentials';
import { signUpSchema } from '@/core/auth/providers/credentials/schemas';
import { createForm, zodForm } from '@modular-forms/solid';
import { action, redirect, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Eye, EyeOff } from 'lucide-solid';
import { Match, Switch } from 'solid-js';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { Button } from '../../ui/button';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from '../../ui/text-field';

const signUpAction = action(async (values: z.infer<typeof signUpSchema>, redirectUrl = '/') => {
  'use server';
  const cookie = await signUp(values);
  throw redirect(redirectUrl, { headers: { 'Set-Cookie': cookie.serialize() } });
});

type EmailPasswordFormProps = {
  redirectUrl?: string;
  onSuccess: () => void;
};

export function EmailPasswordForm(props: EmailPasswordFormProps) {
  const signUp = useAction(signUpAction);

  const [form, { Form, Field }] = createForm<z.infer<typeof signUpSchema>>({
    validate: zodForm(signUpSchema),
  });

  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);

  const onSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof signUpSchema>) => signUp(values, props.redirectUrl),
    onSuccess: () => props.onSuccess(),
    onError: (error) => toast.error(error.message),
  }));

  return (
    <Form onSubmit={(values) => onSubmit.mutate(values)} class='space-y-4'>
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
                autocomplete='new-password'
                class='w-full p-2 pr-10 text-sm sm:text-base'
              />
              <button
                type='button'
                tabindex={-1}
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
      <Field name='confirmPassword'>
        {(field, props) => (
          <TextField
            value={field.value}
            validationState={field.error ? 'invalid' : 'valid'}
            class='w-full'
          >
            <TextFieldLabel class='text-sm sm:text-base'>Confirm Password</TextFieldLabel>
            <div class='relative'>
              <TextFieldInput
                {...props}
                type={showConfirmPassword() ? 'text' : 'password'}
                autocomplete='new-password'
                class='w-full p-2 pr-10 text-sm sm:text-base'
              />
              <button
                type='button'
                tabindex={-1}
                class='absolute inset-y-0 right-0 flex items-center pr-3'
                onClick={() => setShowConfirmPassword(!showConfirmPassword())}
              >
                <Switch>
                  <Match when={showConfirmPassword()}>
                    <EyeOff class='h-5 w-5 text-gray-400' />
                  </Match>
                  <Match when={!showConfirmPassword()}>
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
          Sign Up
        </Button>
      </div>
    </Form>
  );
}
