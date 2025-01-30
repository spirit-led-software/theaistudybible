import { useAuth } from '@/www/contexts/auth';
import { useProSubscription } from '@/www/hooks/use-pro-subscription';
import { cn } from '@/www/lib/utils';
import { Show, createMemo, splitProps } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage, type AvatarRootProps } from '../ui/avatar';
import { Badge } from '../ui/badge';

export const UserAvatar = (props: AvatarRootProps) => {
  const [local, rest] = splitProps(props, ['class']);

  const { user } = useAuth();
  const { hasPro } = useProSubscription();

  const src = createMemo(() => user()?.image || undefined);
  const fallback = createMemo(
    () =>
      `${user()?.firstName?.charAt(0) || user()?.email?.charAt(0) || '?'}${
        user()?.lastName?.charAt(0) || ''
      }`,
  );

  return (
    <div class='relative'>
      <Avatar class={cn('relative size-10', local.class)} {...rest}>
        <AvatarImage src={src()} />
        <AvatarFallback>{fallback()}</AvatarFallback>
      </Avatar>
      <Show when={hasPro()}>
        <Badge
          variant='outline'
          class='-right-2 -bottom-2 absolute h-fit w-fit bg-card px-1 py-0.5 text-[8px]'
        >
          Pro
        </Badge>
      </Show>
    </div>
  );
};
