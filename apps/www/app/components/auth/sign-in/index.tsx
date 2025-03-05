import { Link } from '@tanstack/react-router';
import { Logo } from '../../branding/logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Apple, Google } from '../../ui/brand-icons';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { EmailPasswordForm } from './email-password';
import { PasskeyButton } from './passkey';

export type SignInProps = {
  redirectUrl?: string;
};

export const SignIn = (props: SignInProps) => {
  return (
    <div className='mx-auto w-full max-w-[90%] sm:max-w-md'>
      <Card className='w-full'>
        <CardHeader className='flex flex-col items-center justify-between space-y-4 p-4 sm:p-6'>
          <Logo className='w-3/4 sm:w-2/3' />
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 px-4 sm:px-6'>
          <div className='flex items-center justify-center space-x-2'>
            <span className='text-gray-500 text-sm'>Don't have an account?</span>
            <Button variant='link' className='p-0 text-xs sm:text-sm' asChild>
              <Link to='/sign-up' search={{ redirectUrl: props.redirectUrl }}>
                Sign Up
              </Link>
            </Button>
          </div>
          <div className='flex flex-wrap justify-center gap-2'>
            <Button variant='outline' asChild>
              <Link to='/sign-in/google/authorize' search={{ redirectUrl: props.redirectUrl }}>
                <Google className='mr-2 size-4' />
                Google
              </Link>
            </Button>
            <Button variant='outline' asChild>
              <Link to='/sign-in/apple/authorize' search={{ redirectUrl: props.redirectUrl }}>
                <Apple className='mr-2 size-4' />
                Apple
              </Link>
            </Button>
            <PasskeyButton redirectUrl={props.redirectUrl} />
          </div>
          <Accordion type='multiple' className='w-full px-5' defaultValue={['email-password']}>
            <AccordionItem value='email-password'>
              <AccordionTrigger>Email & Password</AccordionTrigger>
              <AccordionContent>
                <EmailPasswordForm redirectUrl={props.redirectUrl} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className='flex flex-wrap items-baseline justify-center px-4 pb-4 text-center text-gray-500 text-xs sm:px-6'>
            <span className='text-nowrap'>By continuing, you agree to our</span>
            <Button
              variant='link'
              className='mx-1 inline-block h-fit w-fit text-nowrap p-0 text-xs'
              asChild
            >
              <Link to='/terms'>Terms of Service</Link>
            </Button>
            <span className='text-nowrap'>and</span>
            <Button
              variant='link'
              className='mx-1 inline-block h-fit w-fit text-nowrap p-0 text-xs'
              asChild
            >
              <Link to='/privacy'>Privacy Policy</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
