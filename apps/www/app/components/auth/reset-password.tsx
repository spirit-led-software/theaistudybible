import { resetPassword as resetPasswordCore } from '@/core/auth/providers/credentials';
import { resetPasswordSchema } from '@/core/auth/providers/credentials/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Form, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Logo } from '../branding/logo';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

const resetPassword = createServerFn({ method: 'POST' })
  .validator(resetPasswordSchema)
  .handler(async ({ data }) => {
    await resetPasswordCore(data);
    return { success: true };
  });

export type ResetPasswordProps = {
  code: string;
  onSuccess?: () => void;
};

export function ResetPassword(props: ResetPasswordProps) {
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: props.code },
  });

  const onSubmit = useMutation({
    mutationFn: (values: z.infer<typeof resetPasswordSchema>) => resetPassword({ data: values }),
    onSuccess: () => {
      toast.success('Password reset successfully. You can now log in with your new password.');
      props.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit.mutate(values))}
        className='mx-auto w-full max-w-[90%] sm:max-w-md'
      >
        <Card className='w-full'>
          <CardHeader className='flex flex-col items-center justify-between space-y-4 p-4 sm:p-6'>
            <Logo className='w-3/4 sm:w-2/3' />
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 px-4 sm:px-6'>
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-base'>Reset Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='text'
                      autoComplete='one-time-code'
                      className='w-full p-2 pr-10 text-sm sm:text-base'
                    />
                  </FormControl>
                  <FormMessage className='text-xs sm:text-sm' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-base'>New Password</FormLabel>
                  <div className='relative'>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      className='w-full p-2 pr-10 text-sm sm:text-base'
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 right-0 flex items-center pr-3'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400' />
                      )}
                    </button>
                  </div>
                  <FormMessage className='text-xs sm:text-sm' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-base'>Confirm New Password</FormLabel>
                  <div className='relative'>
                    <Input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      className='w-full p-2 pr-10 text-sm sm:text-base'
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 right-0 flex items-center pr-3'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400' />
                      )}
                    </button>
                  </div>
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
            <Button asChild variant='link' className='p-0 text-xs sm:text-sm'>
              <Link to='/sign-in'>Back to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
