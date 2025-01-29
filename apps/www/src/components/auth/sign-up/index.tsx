import { A } from '@solidjs/router';
import { Logo } from '../../branding/logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Apple, Google } from '../../ui/brand-icons';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { EmailPasswordForm } from './email-password';
import { PasskeyForm } from './passkey';

export type SignUpProps = {
  redirectUrl?: string;
};

export function SignUp(props: SignUpProps) {
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
            <Button
              as={A}
              variant='link'
              href={`/sign-in?redirectUrl=${encodeURIComponent(props.redirectUrl ?? '/')}`}
              class='p-0 text-xs sm:text-sm'
            >
              Sign In
            </Button>
          </div>
          <div class='flex flex-wrap justify-center gap-2'>
            <Button as='a' href='/sign-up/google/authorize' variant='outline'>
              <Google class='mr-2 size-4' />
              Google
            </Button>
            <Button as='a' href='/sign-up/apple/authorize' variant='outline'>
              <Apple class='mr-2 size-4' />
              Apple
            </Button>
            <PasskeyForm redirectUrl={props.redirectUrl} />
          </div>
          <Accordion multiple={false} collapsible class='w-full' defaultValue={['email-password']}>
            <AccordionItem value='email-password'>
              <AccordionTrigger>Email & Password</AccordionTrigger>
              <AccordionContent>
                <EmailPasswordForm redirectUrl={props.redirectUrl} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div class='flex flex-wrap items-baseline justify-center px-4 pb-4 text-center text-gray-500 text-xs sm:px-6'>
            <span class='text-nowrap'>By continuing, you agree to our</span>
            <Button
              as={A}
              variant='link'
              href='/terms'
              class='mx-1 inline-block h-fit w-fit text-nowrap p-0 text-xs'
            >
              Terms of Service
            </Button>
            <span class='text-nowrap'>and</span>
            <Button
              as={A}
              variant='link'
              href='/privacy'
              class='mx-1 inline-block h-fit w-fit text-nowrap p-0 text-xs'
            >
              Privacy Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
