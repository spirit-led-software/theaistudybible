import { sqs } from '@/core/queues';
import type { DataSource } from '@/schemas/data-sources/types';
import { requireAdmin } from '@/www/server/utils/auth';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { useAction } from '@solidjs/router';
import { action } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { splitProps } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { Button, type ButtonProps } from '../../ui/button';

const queueSyncDataSourceAction = action(async (id: string) => {
  'use server';
  requireAdmin();
  const response = await sqs.send(
    new SendMessageCommand({
      QueueUrl: Resource.DataSourcesSyncQueue.url,
      MessageBody: JSON.stringify({ id, manual: true }),
    }),
  );
  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error('Failed to queue data source sync');
  }
  return { success: true };
});

export type SyncDataSourceButtonProps = Omit<ButtonProps, 'onClick'> & {
  dataSource: DataSource;
};

const SyncDataSourceButton = (props: SyncDataSourceButtonProps) => {
  const [local, rest] = splitProps(props, ['dataSource']);

  const queueSyncDataSource = useAction(queueSyncDataSourceAction);
  const queryClient = useQueryClient();

  const handleClick = createMutation(() => ({
    mutationFn: () => queueSyncDataSource(local.dataSource.id),
    onSuccess: () => {
      toast.success('Data source sync queued');
    },
    onError: () => {
      toast.error('Failed to queue data source sync');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
    },
  }));

  return (
    <Button
      disabled={local.dataSource.type === 'FILE'}
      onClick={() => handleClick.mutate()}
      {...rest}
    />
  );
};

export { SyncDataSourceButton };
