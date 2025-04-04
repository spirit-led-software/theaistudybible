import { sqs } from '@/core/queues';
import type { DataSource } from '@/schemas/data-sources/types';
import { requireAdminMiddleware } from '@/www/server/middleware/auth';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Resource } from 'sst';
import { z } from 'zod';
import { Button } from '../../ui/button';

const queueSyncDataSource = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const response = await sqs.send(
      new SendMessageCommand({
        QueueUrl: Resource.DataSourcesSyncQueue.url,
        MessageBody: JSON.stringify({ id: data.id, manual: true }),
      }),
    );
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to queue data source sync');
    }
    return { success: true };
  });

export type SyncDataSourceButtonProps = Omit<React.ComponentProps<typeof Button>, 'onClick'> & {
  dataSource: DataSource;
};

const SyncDataSourceButton = ({ dataSource, ...props }: SyncDataSourceButtonProps) => {
  const queryClient = useQueryClient();

  const handleClick = useMutation({
    mutationFn: () => queueSyncDataSource({ data: { id: dataSource.id } }),
    onSuccess: () => {
      toast.success('Data source sync queued');
    },
    onError: () => {
      toast.error('Failed to queue data source sync');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
    },
  });

  return (
    <Button disabled={dataSource.type === 'FILE'} onClick={() => handleClick.mutate()} {...props} />
  );
};

export { SyncDataSourceButton };
