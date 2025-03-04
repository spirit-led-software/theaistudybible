import { useAuth } from '@/www/hooks/use-auth';
import { Mail } from 'lucide-solid';
import { Show } from 'solid-js';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '../../ui/card';
import { H4 } from '../../ui/typography';
import { UpdateAvatarDialog } from './avatar/update-dialog';
import { DeleteProfileDialog } from './delete-dialog';
import { SubscriptionButton } from './subscription-button';
import { EditProfileDialog } from './update-dialog';

export const InfoCard = () => {
  const { user } = useAuth();

  return (
    <Card class='h-full w-full border-none bg-background shadow-none'>
      <CardHeader />
      <CardContent class='flex flex-col items-center gap-6'>
        <div class='group relative'>
          <Avatar class='size-24 border-4 border-primary/10 shadow-md sm:size-32 md:size-40'>
            <AvatarImage src={user()?.image || undefined} />
            <AvatarFallback class='bg-linear-to-br from-primary to-secondary text-3xl text-primary-foreground sm:text-4xl md:text-5xl'>
              {user()?.firstName?.charAt(0) || user()?.email?.charAt(0) || '?'}
              {user()?.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          <div class='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
            <UpdateAvatarDialog />
          </div>
        </div>
        <div class='flex flex-col items-center justify-center gap-2 text-center'>
          <Show
            when={user()?.firstName || user()?.lastName}
            fallback={<H4 class='text-muted-foreground italic'>No Name Provided</H4>}
          >
            <h4 class='font-semibold text-xl sm:text-2xl md:text-3xl'>
              <Show when={user()?.firstName}>
                <span>{user()?.firstName}</span>
              </Show>
              <Show when={user()?.lastName}>
                <span>
                  {user()?.firstName ? ' ' : ''}
                  {user()?.lastName}
                </span>
              </Show>
            </h4>
          </Show>
          <div class='flex items-center gap-2 text-muted-foreground'>
            <Mail class='size-4' />
            <h4 class='truncate text-sm sm:text-base'>{user()?.email}</h4>
          </div>
        </div>
        <div class='flex items-center gap-2'>
          <span class='text-muted-foreground text-sm'>Subscription:</span>
          <SubscriptionButton variant='outline' size='sm' />
        </div>
      </CardContent>
      <CardFooter class='flex justify-center gap-2'>
        <EditProfileDialog />
        <DeleteProfileDialog />
      </CardFooter>
    </Card>
  );
};
