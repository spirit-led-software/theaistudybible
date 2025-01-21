import { db } from '@/core/database';
import { dataSources } from '@/core/database/schema';
import { UpdateDataSourceSchema } from '@/schemas/data-sources';
import type { DataSource } from '@/schemas/data-sources/types';
import { createForm, setValue, zodForm } from '@modular-forms/solid';
import { action, useAction } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal, splitProps } from 'solid-js';
import { toast } from 'solid-sonner';
import { ZodIssueCode, z } from 'zod';
import { Button, type ButtonProps } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from '../../ui/text-field';

const editDataSourceAction = action(
  async (id: string, data: z.infer<typeof UpdateDataSourceFormSchema>) => {
    'use server';
    const { metadata, ...rest } = data;
    const [dataSource] = await db
      .update(dataSources)
      .set({ ...rest, metadata: metadata ? JSON.parse(metadata) : undefined })
      .where(eq(dataSources.id, id))
      .returning();
    return { dataSource };
  },
);

const UpdateDataSourceFormSchema = UpdateDataSourceSchema.extend({
  metadata: z
    .string()
    .optional()
    .transform((str, ctx) => {
      if (!str) {
        return {};
      }
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: (e as Error).message,
        });
        return z.NEVER;
      }
    }),
});

export type EditDataSourceButtonProps = ButtonProps & {
  dataSource: DataSource;
};

export const EditDataSourceButton = (props: EditDataSourceButtonProps) => {
  const [local, rest] = splitProps(props, ['dataSource']);

  const editDataSource = useAction(editDataSourceAction);

  const qc = useQueryClient();

  const [form, { Form, Field }] = createForm<z.infer<typeof UpdateDataSourceFormSchema>>({
    validate: zodForm(UpdateDataSourceFormSchema),
    initialValues: {
      name: local.dataSource.name,
      url: local.dataSource.url,
      type: local.dataSource.type,
      syncSchedule: local.dataSource.syncSchedule,
      metadata: JSON.stringify(local.dataSource.metadata),
    },
  });

  const [isOpen, setIsOpen] = createSignal(false);

  const handleSubmit = createMutation(() => ({
    mutationFn: (data: z.infer<typeof UpdateDataSourceFormSchema>) =>
      editDataSource(local.dataSource.id, data),
    onSuccess: () => {
      setIsOpen(false);
      toast.success('Data source updated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['data-sources'] }),
  }));

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={Button} {...rest} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Data Source</DialogTitle>
        </DialogHeader>
        <Form onSubmit={(data) => handleSubmit.mutate(data)}>
          <div class='flex flex-col gap-4'>
            <Field name='type'>
              {(field, props) => (
                <div class='flex flex-col gap-2'>
                  <Label>Type</Label>
                  <Select
                    value={field.value}
                    onChange={(v) => setValue(form, 'type', v ?? 'WEB_CRAWL')}
                    options={dataSources.type.enumValues}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                    )}
                    placeholder='Type'
                  >
                    <SelectTrigger class='w-fit min-w-24' {...props}>
                      <SelectValue<(typeof dataSources.type.enumValues)[number]>>
                        {(props) => props.selectedOption()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
              )}
            </Field>
            <Field name='name'>
              {(field, props) => (
                <TextField
                  value={field.value}
                  validationState={field.error ? 'invalid' : 'valid'}
                  class='flex-1'
                >
                  <TextFieldLabel>Name</TextFieldLabel>
                  <TextFieldInput type='text' {...props} />
                  <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
                </TextField>
              )}
            </Field>
            <Field name='url'>
              {(field, props) => (
                <TextField value={field.value} validationState={field.error ? 'invalid' : 'valid'}>
                  <TextFieldLabel>URL</TextFieldLabel>
                  <TextFieldInput type='url' {...props} />
                  <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
                </TextField>
              )}
            </Field>
            <Field name='metadata'>
              {(field, props) => (
                <TextField value={field.value} validationState={field.error ? 'invalid' : 'valid'}>
                  <TextFieldLabel>Metadata (JSON)</TextFieldLabel>
                  <TextFieldTextArea type='text' {...props} />
                  <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
                </TextField>
              )}
            </Field>
            <Field name='syncSchedule'>
              {(field, props) => (
                <div class='flex flex-col gap-2'>
                  <Label>Sync Schedule</Label>
                  <Select
                    value={field.value}
                    onChange={(v) => setValue(form, 'syncSchedule', v ?? 'NEVER')}
                    options={dataSources.syncSchedule.enumValues}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                    )}
                    placeholder='Sync Schedule'
                  >
                    <SelectTrigger class='w-fit min-w-24' {...props}>
                      <SelectValue<(typeof dataSources.syncSchedule.enumValues)[number]>>
                        {(props) => props.selectedOption()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
              )}
            </Field>
          </div>
          <DialogFooter>
            <Button type='submit' disabled={form.submitting || form.validating}>
              Save
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
