import { lucia } from '@/core/auth';
import { authProviderQueryOptions, useAuth } from '@/www/contexts/auth';
import { useNavigate } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { toast } from 'solid-sonner';
import { setCookie } from 'vinxi/http';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

async function signOut() {
  'use server';
  const event = getRequestEvent()!;
  const sessionCookie = await lucia.createBlankSessionCookie();
  setCookie(event.nativeEvent, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
}

export type UserButtonProps = {
  showName?: boolean;
};

export const UserButton = (props: UserButtonProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn, user } = useAuth();

  const handleSignOut = createMutation(() => ({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authProviderQueryOptions.queryKey,
      });
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <Show when={isLoaded() && isSignedIn()}>
      <Popover>
        <PopoverTrigger as={Button} variant='ghost' size='icon'>
          <Avatar>
            <AvatarImage src={user()?.image || undefined} />
            <AvatarFallback>
              {user()?.firstName?.charAt(0) || user()?.email?.charAt(0) || '?'}
              {user()?.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
        </PopoverTrigger>
        <PopoverContent class='w-52'>
          <div class='flex flex-col gap-2'>
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
