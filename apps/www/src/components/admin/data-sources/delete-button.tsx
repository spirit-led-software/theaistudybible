import { db } from '@/core/database';
import { dataSources } from '@/core/database/schema';
import type { DataSource } from '@/schemas/data-sources/types';
import { action, useAction } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal, splitProps } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button, type ButtonProps } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';

const deleteDataSourceAction = action(async (id: string) => {
  'use server';
  const [dataSource] = await db.delete(dataSources).where(eq(dataSources.id, id)).returning();
  return { dataSource };
});

export type DeleteDataSourceButtonProps = ButtonProps & {
  dataSource: DataSource;
};

export const DeleteDataSourceButton = (props: DeleteDataSourceButtonProps) => {
  const [local, rest] = splitProps(props, ['dataSource']);

  const deleteDataSource = useAction(deleteDataSourceAction);

  const qc = useQueryClient();

  const [isOpen, setIsOpen] = createSignal(false);

  const handleDelete = createMutation(() => ({
    mutationFn: () => deleteDataSource(local.dataSource.id),
    onSuccess: () => {
      setIsOpen(false);
      toast.success('Data source deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['data-sources'] }),
  }));

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={Button} variant='destructive' {...rest} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Data Source</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {local.dataSource.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => handleDelete.mutate()}
            disabled={handleDelete.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
