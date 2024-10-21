import { UpdateAvatarDialog } from '@/www/components/auth/profile/avatar/update-dialog';
import { DeleteProfileDialog } from '@/www/components/auth/profile/delete-dialog';
import { EditProfileDialog } from '@/www/components/auth/profile/update-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/www/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/www/components/ui/card';
import { GradientH1, H4 } from '@/www/components/ui/typography';
import { useAuth } from '@/www/contexts/auth';
import { Meta, Title } from '@solidjs/meta';
import { Mail } from 'lucide-solid';
import { Show } from 'solid-js';

export default function Profile() {
  const { user } = useAuth();

  return (
    <>
      <Title>Your Profile | The AI Study Bible</Title>
      <Meta name='description' content='Your profile for The AI Study Bible' />
      <div class='container flex justify-center p-4 sm:p-6 md:p-10'>
        <Card class='w-full max-w-lg'>
          <CardHeader>
            <GradientH1 class='text-center text-3xl sm:text-4xl md:text-5xl'>Profile</GradientH1>
          </CardHeader>
          <CardContent class='flex flex-col items-center gap-6'>
            <div class='group relative'>
              <Avatar class='size-24 border-4 border-primary/10 sm:size-32 md:size-40'>
                <AvatarImage src={user()?.image || undefined} />
                <AvatarFallback class='bg-gradient-to-br from-primary to-secondary text-3xl text-primary-foreground sm:text-4xl md:text-5xl'>
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
          </CardContent>
          <CardFooter class='flex justify-center gap-2'>
            <EditProfileDialog />
            <DeleteProfileDialog />
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
