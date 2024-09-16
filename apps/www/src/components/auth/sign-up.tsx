import { signUp } from '@/core/auth/providers/credentials';
import { signUpSchema } from '@/core/auth/providers/credentials/schemas';
import { createForm, zodForm } from '@modular-forms/solid';
import { A, useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Eye, EyeOff } from 'lucide-solid';
import { Match, Show, Switch } from 'solid-js';
import { createSignal } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { toast } from 'solid-sonner';
import { setCookie } from 'vinxi/http';
import type { z } from 'zod';
import Logo from '../branding/logo';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from '../ui/text-field';

export type SignUpProps = {
  redirectUrl?: string;
};

async function handleSignUp(values: z.infer<typeof signUpSchema>) {
  'use server';
  const event = getRequestEvent()!;
  const cookie = await signUp(values);
  setCookie(event.nativeEvent, cookie.name, cookie.value, cookie.attributes);
}

export const SignUp = (props: SignUpProps) => {
  const navigate = useNavigate();

  const [form, { Form, Field }] = createForm<z.infer<typeof signUpSchema>>({
    validate: zodForm(signUpSchema),
  });

  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);

  const onSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof signUpSchema>) => handleSignUp(values),
    onSuccess: () => {
      navigate(props.redirectUrl ?? '/');
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
          <CardTitle>Sign Up</CardTitle>
        </CardHeader>
        <CardContent class='space-y-4 px-4 sm:px-6'>
          <div class='flex items-center justify-center space-x-2'>
            <span class='text-gray-500 text-sm'>Already have an account?</span>
            <Button as={A} variant='link' href='/sign-in' class='p-0 text-xs sm:text-sm'>
              Sign In
            </Button>
          </div>
          <Field name='email'>
            {(field, props) => (
              <TextField validationState={field.error ? 'invalid' : 'valid'} class='w-full'>
                <TextFieldLabel class='text-sm sm:text-base'>Email</TextFieldLabel>
                <TextFieldInput type='email' {...props} class='w-full p-2 text-sm sm:text-base' />
                <Show when={field.error} keyed>
                  {(error) => (
                    <TextFieldErrorMessage class='text-xs sm:text-sm'>
                      {error}
                    </TextFieldErrorMessage>
                  )}
                </Show>
              </TextField>
            )}
          </Field>
          <Field name='password'>
            {(field, props) => (
              <TextField validationState={field.error ? 'invalid' : 'valid'} class='w-full'>
                <TextFieldLabel class='text-sm sm:text-base'>Password</TextFieldLabel>
                <div class='relative'>
                  <TextFieldInput
                    type={showPassword() ? 'text' : 'password'}
                    {...props}
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
                <Show when={field.error} keyed>
                  {(error) => (
                    <TextFieldErrorMessage class='text-xs sm:text-sm'>
                      {error}
                    </TextFieldErrorMessage>
                  )}
                </Show>
              </TextField>
            )}
          </Field>
          <Field name='confirmPassword'>
            {(field, props) => (
              <TextField validationState={field.error ? 'invalid' : 'valid'} class='w-full'>
                <TextFieldLabel class='text-sm sm:text-base'>Confirm Password</TextFieldLabel>
                <div class='relative'>
                  <TextFieldInput
                    type={showConfirmPassword() ? 'text' : 'password'}
                    {...props}
                    class='w-full p-2 pr-10 text-sm sm:text-base'
                  />
                  <button
                    type='button'
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
                <Show when={field.error} keyed>
                  {(error) => (
                    <TextFieldErrorMessage class='text-xs sm:text-sm'>
                      {error}
                    </TextFieldErrorMessage>
                  )}
                </Show>
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
            Sign Up
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
};
