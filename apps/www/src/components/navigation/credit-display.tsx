import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { DEFAULT_CREDITS } from '@/core/utils/credits/default';
import { cn } from '@/www/lib/utils';
import { createQuery } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { eq } from 'drizzle-orm';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Spinner } from '../ui/spinner';
import { H5, H6 } from '../ui/typography';

export async function getUserCredits() {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return 0;
  }

  const [userCredit] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));

  return userCredit?.balance ?? DEFAULT_CREDITS;
}

export function CreditDisplay() {
  const creditsQuery = createQuery(() => ({
    queryKey: ['user-credits'],
    queryFn: () => getUserCredits(),
  }));

  return (
    <Popover>
      <PopoverTrigger
        as={Button}
        variant="outline"
        size="icon"
        class={cn(
          'flex size-10 flex-col items-center justify-center gap-1 rounded-full p-2 lg:flex-row',
          !creditsQuery.isLoading && creditsQuery.data
            ? creditsQuery.data < 3
              ? 'text-red-500'
              : creditsQuery.data < 5
                ? 'text-yellow-500'
                : ''
            : '',
        )}
      >
        {creditsQuery.isLoading ? (
          <Spinner size="sm" />
        ) : creditsQuery.data && creditsQuery.data > DEFAULT_CREDITS ? (
          `>${DEFAULT_CREDITS}`
        ) : (
          creditsQuery.data
        )}
      </PopoverTrigger>
      <PopoverContent class="flex flex-col gap-2">
        <H5>{creditsQuery.data} credits</H5>
        <div>
          <H6>Earn credits by reading</H6>
          <ul class="list-inside list-disc">
            <li class="text-sm">10 minutes of reading = 3 credits</li>
          </ul>
        </div>
        <div>
          <H6>Spend credits using AI</H6>
          <ul class="list-inside list-disc">
            <li class="text-sm">1 response = 1 credit</li>
            <li class="text-sm">1 image = 5 credits</li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
