import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { cn } from '@/www/lib/utils';
import { auth } from '@/www/server/auth';
import { A } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { QueryBoundary } from '../query-boundary';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Spinner } from '../ui/spinner';
import { H5, H6 } from '../ui/typography';

const getUserCredits = GET(async () => {
  'use server';
  const { user } = auth();
  if (!user) {
    return 10;
  }
  const [userCredit] = await db.select().from(userCredits).where(eq(userCredits.userId, user.id));
  return userCredit?.balance ?? 10;
});

export function CreditDisplay() {
  const creditsQuery = createQuery(() => ({
    queryKey: ['user-credits'],
    queryFn: () => getUserCredits(),
  }));

  return (
    <QueryBoundary query={creditsQuery} loadingFallback={<Spinner size='sm' />}>
      {(credits) => (
        <Popover>
          <PopoverTrigger
            as={Button}
            variant='outline'
            size='icon'
            class={cn(
              'flex size-8 flex-col items-center justify-center gap-1 rounded-full p-2 text-xs lg:flex-row',
              credits < 3 && 'text-red-500',
              credits < 5 && 'text-yellow-500',
            )}
          >
            {credits > 10 ? `>${10}` : credits}
          </PopoverTrigger>
          <PopoverContent class='flex flex-col gap-2'>
            <H5>{credits} credits</H5>

            <div>
              <H6>Spend credits using AI</H6>
              <ul class='list-inside list-disc'>
                <li class='text-sm'>1 response = 1 credit</li>
                <li class='text-sm'>1 image = 5 credits</li>
              </ul>
            </div>
            <Button as={A} href='/credits'>
              Purchase Credits
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </QueryBoundary>
  );
}
