import type { useChat } from '@/www/hooks/use-chat';
import { formatDate } from 'date-fns';
import { QueryBoundary } from '../query-boundary';

export type RemainingMessagesProps = {
  remainingMessagesQuery: ReturnType<typeof useChat>['remainingMessagesQuery'];
};

export const RemainingMessages = (props: RemainingMessagesProps) => {
  return (
    <div class='mx-auto h-3 w-fit'>
      <QueryBoundary query={props.remainingMessagesQuery}>
        {({ remaining }) => (
          <span class='text-muted-foreground text-xs'>
            <strong>
              {remaining.remaining === Number.POSITIVE_INFINITY ? 'Unlimited' : remaining.remaining}
            </strong>{' '}
            messages remaining until <strong>{formatDate(remaining.reset, 'M/d/yy h:mm a')}</strong>
          </span>
        )}
      </QueryBoundary>
    </div>
  );
};
