import { signIn } from '@/core/auth/providers/credentials';
import { signInSchema } from '@/core/auth/providers/credentials/schemas';
import { useAuth } from '@/www/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';

const signInWithEmailPassword = createServerFn({ method: 'POST' })
  .validator(
    signInSchema.and(
      z.object({
        redirectUrl: z.string().optional(),
      }),
    ),
  )
  .handler(async ({ data: { redirectUrl, ...data } }) => {
    const cookie = await signIn(data);
    throw redirect({ to: redirectUrl, headers: { 'Set-Cookie': cookie.serialize() } });
  });

type EmailPasswordFormProps = {
  redirectUrl?: string;
};

export const EmailPasswordForm = ({ redirectUrl }: EmailPasswordFormProps) => {
  const { refetch } = useAuth();

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      signInWithEmailPassword({ data: { ...values, redirectUrl } }),
    onSuccess: () => refetch(),
    onError: (error) => toast.error(error.message),
  });

  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit.mutate(values))} className='space-y-4'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' {...field} />
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
                    autoComplete='current-password'
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
        <div className='flex w-full flex-col items-center space-y-3'>
          <Button
            type='submit'
            disabled={form.formState.isSubmitting || form.formState.isLoading}
            className='w-full'
          >
            Sign In
          </Button>
          <Button variant='link' className='p-0 text-xs sm:text-sm' asChild>
            <Link to='/forgot-password'>Forgot Password?</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};
