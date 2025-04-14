import type { useChat } from '@/www/hooks/use-chat';
import { formatDate } from 'date-fns';
import { QueryBoundary } from '../query-boundary';

export type RemainingMessagesProps = {
  remainingMessagesQuery: ReturnType<typeof useChat>['remainingMessagesQuery'];
};

export const RemainingMessages = (props: RemainingMessagesProps) => {
  return (
    <div className='mx-auto h-3 w-fit'>
      <QueryBoundary
        query={props.remainingMessagesQuery}
        render={({ remaining }) => (
          <span className='text-muted-foreground text-xs'>
            <strong>
              {remaining.remaining === Number.POSITIVE_INFINITY ? 'Unlimited' : remaining.remaining}
            </strong>{' '}
            messages remaining until <strong>{formatDate(remaining.reset, 'M/d/yy h:mm a')}</strong>
          </span>
        )}
      />
    </div>
  );
};
