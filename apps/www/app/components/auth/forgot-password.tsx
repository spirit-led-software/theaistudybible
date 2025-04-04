import { requestPasswordReset } from '@/core/auth/providers/credentials';
import { forgotPasswordSchema } from '@/core/auth/providers/credentials/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Logo } from '../branding/logo';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

export type ForgotPasswordProps = {
  onSuccess?: () => void;
};

const forgotPassword = createServerFn({ method: 'POST' })
  .validator(forgotPasswordSchema)
  .handler(async ({ data: { email } }) => {
    await requestPasswordReset({ email });
    return { success: true };
  });

export const ForgotPassword = (props: ForgotPasswordProps) => {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = useMutation({
    mutationFn: (values: z.infer<typeof forgotPasswordSchema>) => forgotPassword({ data: values }),
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.');
      props.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit.mutateAsync(values))}
        className='mx-auto w-full max-w-[90%] sm:max-w-md'
      >
        <Card className='w-full'>
          <CardHeader className='flex flex-col items-center justify-between space-y-4 p-4 sm:p-6'>
            <Logo className='w-3/4 sm:w-2/3' />
            <CardTitle>Forgot Password</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 px-4 sm:px-6'>
            <div className='flex items-center justify-center space-x-2'>
              <span className='text-gray-500 text-sm'>Remember your password?</span>
              <Button asChild variant='link' className='p-0 text-xs sm:text-sm'>
                <Link to='/sign-in'>Sign In</Link>
              </Button>
            </div>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-base'>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      autoComplete='email'
                      className='w-full p-2 text-sm sm:text-base'
                    />
                  </FormControl>
                  <FormMessage className='text-xs sm:text-sm' />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className='flex w-full flex-col items-center justify-between space-y-3 px-4 py-4 sm:px-6 sm:py-5'>
            <Button
              type='submit'
              disabled={form.formState.isValidating || form.formState.isSubmitting}
              className='w-full text-sm sm:text-base'
            >
              Reset Password
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
