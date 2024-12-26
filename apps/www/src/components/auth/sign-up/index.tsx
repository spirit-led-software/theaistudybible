import { A } from '@solidjs/router';
import { Logo } from '../../branding/logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
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
          <Accordion multiple={false} collapsible class='w-full' defaultValue={['passkey']}>
            <AccordionItem value='passkey'>
              <AccordionTrigger>With Passkey</AccordionTrigger>
              <AccordionContent>
                <PasskeyForm redirectUrl={props.redirectUrl} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value='email-password'>
              <AccordionTrigger>With Email & Password</AccordionTrigger>
              <AccordionContent>
                <EmailPasswordForm redirectUrl={props.redirectUrl} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
