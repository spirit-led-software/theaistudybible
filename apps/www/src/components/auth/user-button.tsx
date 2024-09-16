import { useAuth } from '@/www/contexts/auth';
import { Show } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

export type UserButtonProps = {
  showName?: boolean;
};

export const UserButton = (props: UserButtonProps) => {
  const { isLoaded, isSignedIn, user } = useAuth();
  return (
    <Show when={isLoaded() && isSignedIn()}>
      <Button variant='ghost' size='icon'>
        <Avatar>
          <AvatarImage src={user()?.image || undefined} />
          <AvatarFallback>
            {user()?.firstName?.charAt(0) || '?'}
            {user()?.lastName?.charAt(0) || ''}
          </AvatarFallback>
        </Avatar>
      </Button>
    </Show>
  );
};
