import { useAction } from '@solidjs/router';

import { db } from '@/core/database';
import type { DataSource } from '@/schemas/data-sources/types';
import { requireAdmin } from '@/www/server/auth';
import { action } from '@solidjs/router';
import { splitProps } from 'solid-js';
import { Button, type ButtonProps } from '../../ui/button';

const syncDataSourceAction = action(async (id: string) => {
  'use server';
  requireAdmin();
  const dataSource = await db.query.dataSources.findFirst({
    where: (dataSources, { eq }) => eq(dataSources.id, id),
  });
  if (!dataSource) {
    throw new Error('Data source not found');
  }
  return { dataSource };
});

export type SyncDataSourceButtonProps = Omit<ButtonProps, 'onClick'> & {
  dataSource: DataSource;
};

const SyncDataSourceButton = (props: SyncDataSourceButtonProps) => {
  const [local, rest] = splitProps(props, ['dataSource']);
  const syncDataSource = useAction(syncDataSourceAction);

  return <Button onClick={() => syncDataSource(local.dataSource.id)} {...rest} />;
};

export { SyncDataSourceButton };
