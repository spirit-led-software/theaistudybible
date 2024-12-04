import { signUp } from '@/core/auth/providers/credentials';
import type { signUpSchema } from '@/core/auth/providers/credentials/schemas';
import { useAuth } from '@/www/contexts/auth';
import { A, action, redirect, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { Logo } from '../../branding/logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { EmailPasswordForm } from './email-password';
import { PasskeyForm } from './passkey';

export type SignUpProps = {
  redirectUrl?: string;
};

const signUpAction = action(async (values: z.infer<typeof signUpSchema>, redirectUrl = '/') => {
  'use server';
  const cookie = await signUp(values);
  throw redirect(redirectUrl, { headers: { 'Set-Cookie': cookie.serialize() } });
});

export function SignUp(props: SignUpProps) {
  const signUp = useAction(signUpAction);
  const { invalidate } = useAuth();

  const onSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof signUpSchema>) => signUp(values, props.redirectUrl),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <div class='mx-auto w-full max-w-[90%] sm:max-w-md'>
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
          <Accordion multiple={false} collapsible class='w-full' defaultValue={['passkey']}>
            <AccordionItem value='passkey'>
              <AccordionTrigger>With Passkey</AccordionTrigger>
              <AccordionContent>
                <PasskeyForm redirectUrl={props.redirectUrl} onSuccess={() => invalidate()} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value='email-password'>
              <AccordionTrigger>With Email & Password</AccordionTrigger>
              <AccordionContent>
                <EmailPasswordForm onSubmit={(values) => onSubmit.mutateAsync(values)} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
