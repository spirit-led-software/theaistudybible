import { useAuth } from '@/www/hooks/use-auth';
import { Mail } from 'lucide-react';
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
    <Card className='h-full w-full border-none bg-background shadow-none'>
      <CardHeader />
      <CardContent className='flex flex-col items-center gap-6'>
        <div className='group relative'>
          <Avatar className='size-24 border-4 border-primary/10 shadow-md sm:size-32 md:size-40'>
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className='bg-linear-to-br from-primary to-secondary text-3xl text-primary-foreground sm:text-4xl md:text-5xl'>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || '?'}
              {user?.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
            <UpdateAvatarDialog />
          </div>
        </div>
        <div className='flex flex-col items-center justify-center gap-2 text-center'>
          {user?.firstName && user.lastName ? (
            <h4 className='font-semibold text-xl sm:text-2xl md:text-3xl'>
              <span>{user?.firstName}</span>
              {user?.lastName && (
                <span>
                  {user?.firstName ? ' ' : ''}
                  {user?.lastName}
                </span>
              )}
            </h4>
          ) : (
            <H4 className='text-muted-foreground italic'>No Name Provided</H4>
          )}
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Mail className='size-4' />
            <h4 className='truncate text-sm sm:text-base'>{user?.email}</h4>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>Subscription:</span>
          <SubscriptionButton variant='outline' size='sm' />
        </div>
      </CardContent>
      <CardFooter className='flex justify-center gap-2'>
        <EditProfileDialog />
        <DeleteProfileDialog />
      </CardFooter>
    </Card>
  );
};
