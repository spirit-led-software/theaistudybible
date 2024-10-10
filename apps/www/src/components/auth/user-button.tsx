import { lucia } from '@/core/auth';
import { useAuth } from '@/www/contexts/auth';
import { action, redirect, useAction, useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { H6 } from '../ui/typography';
import { UserAvatar } from './user-avatar';

const signOutAction = action(() => {
  'use server';
  const cookie = lucia.createBlankSessionCookie();
  throw redirect('/', { headers: { 'Set-Cookie': cookie.serialize() } });
});

export type UserButtonProps = {
  showName?: boolean;
};

export const UserButton = (props: UserButtonProps) => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user, invalidate } = useAuth();
  const signOut = useAction(signOutAction);

  const handleSignOut = createMutation(() => ({
    mutationFn: () => Promise.resolve(signOut()),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <Show when={isLoaded() && isSignedIn()}>
      <Popover>
        <PopoverTrigger
          as={Button}
          variant='ghost'
          size='icon'
          class='flex h-fit w-fit shrink-0 items-center gap-1 p-0.5'
        >
          <Show when={props.showName && (user()?.firstName || user()?.lastName)}>
            <div class='flex flex-wrap items-center gap-2'>
              <Show when={user()?.firstName} keyed>
                {(firstName) => <span>{firstName}</span>}
              </Show>
              <Show when={user()?.lastName} keyed>
                {(lastName) => <span>{lastName}</span>}
              </Show>
            </div>
          </Show>
          <UserAvatar />
        </PopoverTrigger>
        <PopoverContent class='w-64'>
          <div class='flex flex-col gap-2'>
            <H6 class='flex flex-wrap items-center justify-center gap-2'>
              <Show when={user()?.firstName} keyed>
                {(firstName) => <span>{firstName}</span>}
              </Show>
              <Show when={user()?.lastName} keyed>
                {(lastName) => <span>{lastName}</span>}
              </Show>
            </H6>
            <Button variant='outline' onClick={() => navigate('/profile')}>
              Manage Account
            </Button>
            <Button onClick={() => handleSignOut.mutateAsync()}>Sign Out</Button>
          </div>
        </PopoverContent>
      </Popover>
    </Show>
  );
};
