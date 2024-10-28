import { useAuth } from '@/www/contexts/auth';
import { cn } from '@/www/lib/utils';
import { createMemo, splitProps } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage, type AvatarRootProps } from '../ui/avatar';

export const UserAvatar = (props: AvatarRootProps) => {
  const [local, rest] = splitProps(props, ['class']);

  const { user } = useAuth();

  const src = createMemo(() => user()?.image || undefined);
  const fallback = createMemo(
    () =>
      `${user()?.firstName?.charAt(0) || user()?.email?.charAt(0) || '?'}${
        user()?.lastName?.charAt(0) || ''
      }`,
  );

  return (
    <Avatar class={cn('size-10', local.class)} {...rest}>
      <AvatarImage src={src()} />
      <AvatarFallback>{fallback()}</AvatarFallback>
    </Avatar>
  );
};
