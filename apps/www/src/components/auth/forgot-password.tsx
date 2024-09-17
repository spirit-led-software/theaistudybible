import { requestPasswordReset } from '@/core/auth/providers/credentials';
import { forgotPasswordSchema } from '@/core/auth/providers/credentials/schemas';
import { createForm, zodForm } from '@modular-forms/solid';
import { A } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import Logo from '../branding/logo';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from '../ui/text-field';

export type ForgotPasswordProps = {
  onSuccess?: () => void;
};

async function handleForgotPassword(values: z.infer<typeof forgotPasswordSchema>) {
  'use server';
  await requestPasswordReset({ email: values.email });
}

export const ForgotPassword = (props: ForgotPasswordProps) => {
  const [form, { Form, Field }] = createForm<z.infer<typeof forgotPasswordSchema>>({
    validate: zodForm(forgotPasswordSchema),
  });

  const onSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof forgotPasswordSchema>) => handleForgotPassword(values),
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.');
      props.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <Form
      onSubmit={(values) => onSubmit.mutateAsync(values)}
      class='mx-auto w-full max-w-[90%] sm:max-w-md'
    >
      <Card class='w-full'>
        <CardHeader class='flex flex-col items-center justify-between space-y-4 p-4 sm:p-6'>
          <Logo class='w-3/4 sm:w-2/3' />
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent class='space-y-4 px-4 sm:px-6'>
          <div class='flex items-center justify-center space-x-2'>
            <span class='text-gray-500 text-sm'>Remember your password?</span>
            <Button as={A} variant='link' href='/sign-in' class='p-0 text-xs sm:text-sm'>
              Sign In
            </Button>
          </div>
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
        </CardFooter>
      </Card>
    </Form>
  );
};
