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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/www/components/ui/form';
import { Input } from '@/www/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/www/components/ui/select';
import { Textarea } from '@/www/components/ui/textarea';
import { requireAdminMiddleware } from '@/www/server/middleware/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getTableColumns } from 'drizzle-orm/utils';
import { FolderArchive } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Resource } from 'sst';
import { ZodIssueCode, z } from 'zod';

export const Route = createFileRoute('/_with-sidebar/admin/data-source')({
  component: RouteComponent,
});

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

const createDataSource = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(CreateDataSourceFormSchema.omit({ file: true }))
  .handler(async ({ data }) => {
    'use server';
    const [dataSource] = await db.insert(dataSources).values(data).returning();
    return { dataSource };
  });

const getPresignedUrl = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .validator(
    z.object({
      name: z.string(),
      contentType: z.string(),
      metadata: z.record(z.string(), z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    'use server';
    const { name, contentType, metadata } = data;
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
  });

function RouteComponent() {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof CreateDataSourceFormSchema>>({
    resolver: zodResolver(CreateDataSourceFormSchema),
    defaultValues: {
      metadata: JSON.stringify({ category: '', title: '', author: '' }, null, 2),
      syncSchedule: 'NEVER',
    },
  });

  const onSubmit = useMutation({
    mutationFn: async (values: z.input<typeof CreateDataSourceFormSchema>) => {
      if (values.type === 'FILE' && values.file) {
        const { presignedUrl } = await getPresignedUrl({
          data: {
            name: values.name,
            contentType: values.file.type,
            metadata: {
              originalName: values.file.name,
              size: values.file.size.toString(),
            },
          },
        });

        await fetch(presignedUrl, {
          method: 'PUT',
          body: values.file,
          headers: {
            'Content-Type': values.file.type,
          },
        });
      }

      const { metadata, file, ...rest } = values;
      return createDataSource({
        data: {
          ...rest,
          metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
      toast.success('Data source added');
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => form.reset(),
  });

  const [fileState, setFileState] = useState<FileList>();

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Add Data Source</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit.mutate(values))}
          className='space-y-4'
        >
          <CardContent className='flex flex-col gap-4'>
            <div className='flex gap-4'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem className='flex flex-col gap-2'>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value: string) => field.onChange(value || 'WEB_CRAWL')}
                    >
                      <FormControl>
                        <SelectTrigger className='w-fit min-w-24'>
                          <SelectValue placeholder='Type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getTableColumns(dataSources).type.enumValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input type='text' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input type='url' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='metadata'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('type') === 'FILE' && (
              <FormField
                control={form.control}
                name='file'
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <FileInput
                        value={fileState}
                        onChange={(files) => {
                          setFileState(files);
                          onChange(files);
                        }}
                      >
                        <FileInputRoot className='h-32'>
                          <FileInputTrigger className='flex h-full items-center justify-center border-2 border-gray-300 border-dashed p-4 text-lg'>
                            <FolderArchive className='mr-4 size-8' />
                            Choose File
                          </FileInputTrigger>
                          <FileInputInput {...rest} />
                          <FileInputDropArea className='border-2 border-gray-300 border-dashed p-4'>
                            Drop your file here
                          </FileInputDropArea>
                        </FileInputRoot>
                      </FileInput>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='syncSchedule'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2'>
                  <FormLabel>Sync Schedule</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: string) => field.onChange(value || 'NEVER')}
                  >
                    <FormControl>
                      <SelectTrigger className='w-fit min-w-24'>
                        <SelectValue placeholder='Sync Schedule' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dataSources.syncSchedule.enumValues.map((schedule) => (
                        <SelectItem key={schedule} value={schedule}>
                          {schedule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className='flex justify-end'>
            <Button
              type='submit'
              disabled={form.formState.isSubmitting || form.formState.isValidating}
            >
              Add Source
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
