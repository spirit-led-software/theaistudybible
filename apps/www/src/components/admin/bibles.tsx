import { s3 } from '@/core/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createMutation } from '@tanstack/solid-query';
import { FolderArchive } from 'lucide-solid';
import { createEffect, createSignal, on } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { FileInput, FileInputDropArea, FileInputRoot, FileInputTrigger } from '../ui/file-input';
import { TabsContent } from '../ui/tabs';

async function requestUpload({ name, size }: { name: string; size: number }) {
  'use server';
  return await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: Resource.BibleBucket.name,
      Key: name,
      ContentLength: size,
      ContentType: 'application/zip',
    }),
  );
}

export const BiblesContent = () => {
  const [files, setFiles] = createSignal<FileList>();
  const [toastId, setToastId] = createSignal<string | number>();

  const uploadFileMutation = createMutation(() => ({
    mutationFn: async ({ url, file }: { url: string; file: File }) => {
      await fetch(url, {
        method: 'PUT',
        body: file,
      });
    },
    onSuccess: () => {
      toast.dismiss(toastId());
      toast.success('Bible zip uploaded');
      setFiles(undefined);
    },
    onError: () => {
      toast.dismiss(toastId());
      toast.error('Failed to upload bible zip');
    },
  }));

  const requestUploadMutation = createMutation(() => ({
    mutationFn: requestUpload,
    onMutate: () => {
      setToastId(toast.loading('Uploading...', { duration: Infinity }));
    },
    onError: () => {
      toast.dismiss(toastId());
      toast.error('Failed to request upload');
    },
  }));

  createEffect(
    on(files, async (files) => {
      if (files) {
        const file = files[0];
        const url = await requestUploadMutation.mutateAsync({
          name: file.name,
          size: file.size,
        });
        uploadFileMutation.mutate({
          url,
          file,
        });
      }
    }),
  );

  return (
    <TabsContent value="bibles">
      <Card>
        <CardHeader>
          <CardTitle>Bibles</CardTitle>
          <CardDescription>Add a new Bible</CardDescription>
        </CardHeader>
        <CardContent>
          <FileInput value={files()} onChange={setFiles}>
            <FileInputRoot class="h-32">
              <FileInputTrigger class="flex h-full items-center justify-center border-2 border-dashed border-gray-300 p-4 text-lg">
                <FolderArchive class="mr-4 size-8" />
                Choose zip
              </FileInputTrigger>
              <FileInputDropArea class="border-2 border-dashed border-gray-300 p-4">
                Drop your zip file here
              </FileInputDropArea>
            </FileInputRoot>
          </FileInput>
        </CardContent>
        <CardFooter />
      </Card>
    </TabsContent>
  );
};
