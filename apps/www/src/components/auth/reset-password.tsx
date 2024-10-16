import { resetPassword } from '@/core/auth/providers/credentials';
import { resetPasswordSchema } from '@/core/auth/providers/credentials/schemas';
import { createForm, zodForm } from '@modular-forms/solid';
import { A, action, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Eye, EyeOff } from 'lucide-solid';
import { Match, Switch } from 'solid-js';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import Logo from '../branding/logo';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from '../ui/text-field';

export type ResetPasswordProps = {
  code: string;
  onSuccess?: () => void;
};

const resetPasswordAction = action(async (values: z.infer<typeof resetPasswordSchema>) => {
  'use server';
  await resetPassword(values);
  return { success: true };
});

export function ResetPassword(props: ResetPasswordProps) {
  const resetPassword = useAction(resetPasswordAction);

  const [form, { Form, Field }] = createForm<z.infer<typeof resetPasswordSchema>>({
    validate: zodForm(resetPasswordSchema),
    initialValues: {
      code: props.code,
    },
  });

  const onSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof resetPasswordSchema>) => resetPassword(values),
    onSuccess: () => {
      toast.success('Password reset successfully. You can now log in with your new password.');
      props.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);

  return (
    <Form
      onSubmit={(values) => onSubmit.mutateAsync(values)}
      class='mx-auto w-full max-w-[90%] sm:max-w-md'
    >
      <Card class='w-full'>
        <CardHeader class='flex flex-col items-center justify-between space-y-4 p-4 sm:p-6'>
          <Logo class='w-3/4 sm:w-2/3' />
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent class='space-y-4 px-4 sm:px-6'>
          <Field name='password'>
            {(field, props) => (
              <TextField
                value={field.value}
                validationState={field.error ? 'invalid' : 'valid'}
                class='w-full'
              >
                <TextFieldLabel class='text-sm sm:text-base'>New Password</TextFieldLabel>
                <div class='relative'>
                  <TextFieldInput
                    {...props}
                    type={showPassword() ? 'text' : 'password'}
                    autocomplete='new-password'
                    class='w-full p-2 pr-10 text-sm sm:text-base'
                  />
                  <button
                    type='button'
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
                <TextFieldErrorMessage class='text-xs sm:text-sm'>
                  {field.error}
                </TextFieldErrorMessage>
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
                <TextFieldLabel class='text-sm sm:text-base'>Confirm New Password</TextFieldLabel>
                <div class='relative'>
                  <TextFieldInput
                    {...props}
                    type={showConfirmPassword() ? 'text' : 'password'}
                    autocomplete='new-password'
                    class='w-full p-2 pr-10 text-sm sm:text-base'
                  />
                  <button
                    type='button'
                    class='absolute inset-y-0 right-0 flex items-center pr-3'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword())}
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
                <TextFieldErrorMessage class='text-xs sm:text-sm'>
                  {field.error}
                </TextFieldErrorMessage>
              </TextField>
            )}
          </Field>
        </CardContent>
        <CardFooter class='flex w-full flex-col items-center justify-between space-y-3 px-4 py-4 sm:px-6 sm:py-5'>
          <Button
            type='submit'
            disabled={form.validating || form.submitting}
            class='w-full text-sm sm:text-base'
          >
            Reset Password
          </Button>
          <Button as={A} variant='link' href='/sign-in' class='p-0 text-xs sm:text-sm'>
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
