import { signUp } from '@/core/auth/providers/credentials';
import { signUpSchema } from '@/core/auth/providers/credentials/schemas';
import { useAuth } from '@/www/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';

const signUpWithEmailPassword = createServerFn({ method: 'POST' })
  .validator(
    signUpSchema.and(
      z.object({
        redirectUrl: z.string().optional(),
      }),
    ),
  )
  .handler(async ({ data: { redirectUrl, ...data } }) => {
    const cookie = await signUp(data);
    throw redirect({ to: redirectUrl, headers: { 'Set-Cookie': cookie.serialize() } });
  });

type EmailPasswordFormProps = {
  redirectUrl?: string;
};

export const EmailPasswordForm = ({ redirectUrl }: EmailPasswordFormProps) => {
  const { refetch } = useAuth();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      signUpWithEmailPassword({ data: { ...values, redirectUrl } }),
    onSuccess: () => refetch(),
    onError: (error) => toast.error(error.message),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit.mutate(values))} className='space-y-4'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm sm:text-base'>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  autoComplete='email'
                  className='w-full p-2 text-sm sm:text-base'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel className='text-sm sm:text-base'>Password</FormLabel>
              <div className='relative'>
                <FormControl>
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    className='w-full p-2 pr-10 text-sm sm:text-base'
                  />
                </FormControl>
                <button
                  type='button'
                  tabIndex={-1}
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel className='text-sm sm:text-base'>Confirm Password</FormLabel>
              <div className='relative'>
                <FormControl>
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    className='w-full p-2 pr-10 text-sm sm:text-base'
                  />
                </FormControl>
                <button
                  type='button'
                  tabIndex={-1}
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
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex w-full flex-col items-center space-y-3'>
          <Button
            type='submit'
            disabled={form.formState.isSubmitting || form.formState.isLoading}
            className='w-full'
          >
            Sign Up
          </Button>
        </div>
      </form>
    </Form>
  );
};
