import { useAuth } from '@/www/contexts/auth';
import type { PolymorphicProps } from '@kobalte/core';
import type { ImageRootProps } from '@kobalte/core/image';
import type { ValidComponent } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const UserAvatar = <T extends ValidComponent>(
  props: PolymorphicProps<T, ImageRootProps>,
) => {
  const { user } = useAuth();
  return (
    <Avatar {...(props as ImageRootProps)}>
      <AvatarImage src={user()?.image || undefined} />
      <AvatarFallback>
        {user()?.firstName?.charAt(0) || user()?.email?.charAt(0) || '?'}
        {user()?.lastName?.charAt(0) || ''}
      </AvatarFallback>
    </Avatar>
  );
};
