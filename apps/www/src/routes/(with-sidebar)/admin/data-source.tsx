import { db } from '@/core/database';
import { dataSources } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { transformKeys } from '@/core/utils/object';
import { CreateDataSourceSchema } from '@/schemas/data-sources';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import {
  FileInput,
  FileInputDropArea,
  FileInputInput,
  FileInputRoot,
  FileInputTrigger,
} from '@/www/components/ui/file-input';
import { Label } from '@/www/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/www/components/ui/select';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from '@/www/components/ui/text-field';
import { requireAdmin } from '@/www/server/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createForm, getError, getValue, setValue, zodForm } from '@modular-forms/solid';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { getTableColumns } from 'drizzle-orm/utils';
import { FolderArchive } from 'lucide-solid';
import { Show, createEffect, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { ZodIssueCode, z } from 'zod';

const createDataSourceAction = action(
  async (values: Omit<z.infer<typeof CreateDataSourceFormSchema>, 'file'>) => {
    'use server';
    requireAdmin();
    const validatedData = CreateDataSourceFormSchema.parse(values);
    const [dataSource] = await db.insert(dataSources).values(validatedData).returning();
    return { dataSource };
  },
);

const getPresignedUrl = GET(
  async (input: {
    name: string;
    contentType: string;
    metadata?: Record<string, string>;
  }) => {
    'use server';
    const { name, contentType, metadata } = input;
    const command = new PutObjectCommand({
      Bucket: Resource.DataSourceFilesBucket.name,
      Key: name,
      ContentType: contentType,
      Metadata: transformKeys(metadata ?? {}, 'toKebab'),
    });
    return {
      presignedUrl: await getSignedUrl(s3, command, {
        expiresIn: 60 * 60 * 24,
      }),
    };
  },
);

const CreateDataSourceFormSchema = CreateDataSourceSchema.extend({
  metadata: z
    .record(z.string(), z.string())
    .or(
      z.string().transform((str, ctx) => {
        if (!str) {
          return {};
        }
        try {
          return JSON.parse(str);
        } catch {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: 'Invalid JSON',
          });
          return z.NEVER;
        }
      }),
    )
    .optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size < 100 * 1024 * 1024, {
      message: 'File must be less than 100MB',
    })
    .refine(
      (file) => {
        const allowedTypes = [
          'application/pdf',
          'text/csv',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message: 'File must be a PDF, CSV, TXT or Word document',
      },
    )
    .optional(),
});

const AddSourcePage = () => {
  const createDataSource = useAction(createDataSourceAction);
  const queryClient = useQueryClient();

  const [form, { Form, Field }] = createForm<z.infer<typeof CreateDataSourceFormSchema>>({
    validate: zodForm(CreateDataSourceFormSchema),
    initialValues: {
      metadata: JSON.stringify({ category: '', title: '', author: '' }, null, 2),
      syncSchedule: 'NEVER',
    },
  });

  const onSubmit = createMutation(() => ({
    mutationFn: async (values: z.input<typeof CreateDataSourceFormSchema>) => {
      const { file, ...rest } = CreateDataSourceFormSchema.parse(values);
      const { dataSource } = await createDataSource(rest);
      if (file) {
        const presignedUrl = await getPresignedUrl({
          name: file.name,
          contentType: file.type,
          metadata: {
            ...rest.metadata,
            name: rest.name,
            url: rest.url,
            type: rest.type,
            dataSourceId: dataSource.id,
          },
        });
        const response = await fetch(presignedUrl.presignedUrl, {
          method: 'PUT',
          body: file,
        });
        if (!response.ok) {
          throw new Error('Failed to upload file');
        }
      }
    },
    onSuccess: () => {
      toast.success('Data source added');
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['data-sources'] }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Data Source</CardTitle>
      </CardHeader>
      <Form onSubmit={(data) => onSubmit.mutate(data)}>
        <CardContent class='flex flex-col gap-4'>
          <div class='flex gap-4'>
            <Field name='type'>
              {(field, props) => (
                <div class='flex flex-col gap-2'>
                  <Label>Type</Label>
                  <Select
                    value={field.value}
                    onChange={(v) => setValue(form, field.name, v ?? 'WEB_CRAWL')}
                    options={getTableColumns(dataSources).type.enumValues}
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
          </div>
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
                <TextFieldTextArea type='text' autoResize {...props} />
                <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>
              </TextField>
            )}
          </Field>
          <Show when={getValue(form, 'type') === 'FILE'}>
            <Field name='file' type='File'>
              {(field, props) => {
                const [fileList, setFileList] = createSignal<FileList>();
                createEffect(() => {
                  const currentFile = fileList()?.[0];
                  if (currentFile) {
                    setValue(form, field.name, currentFile);
                  }
                });

                return (
                  <div class='flex flex-col gap-1'>
                    <FileInput value={fileList()} onChange={setFileList}>
                      <FileInputRoot class='h-32'>
                        <FileInputTrigger class='flex h-full items-center justify-center border-2 border-gray-300 border-dashed p-4 text-lg'>
                          <FolderArchive class='mr-4 size-8' />
                          Choose File
                        </FileInputTrigger>
                        <FileInputInput {...props} />
                        <FileInputDropArea class='border-2 border-gray-300 border-dashed p-4'>
                          Drop your file here
                        </FileInputDropArea>
                      </FileInputRoot>
                    </FileInput>
                    <Show when={getError(form, 'file')} keyed>
                      {(error) => <p class='text-error text-sm'>{error}</p>}
                    </Show>
                  </div>
                );
              }}
            </Field>
          </Show>
          <Field name='syncSchedule'>
            {(field, props) => (
              <div class='flex flex-col gap-2'>
                <Label>Sync Schedule</Label>
                <Select
                  value={field.value}
                  onChange={(v) => setValue(form, field.name, v ?? 'NEVER')}
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
        </CardContent>
        <CardFooter class='flex justify-end'>
          <Button type='submit' disabled={form.submitting || form.validating}>
            Add Source
          </Button>
        </CardFooter>
      </Form>
    </Card>
  );
};

export default AddSourcePage;
