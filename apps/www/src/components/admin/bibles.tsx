import { s3 } from '@/core/storage';
import { createId } from '@/core/utils/id';
import { hasRole } from '@/core/utils/user';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createMutation } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { FolderArchive } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { FileInput, FileInputDropArea, FileInputRoot, FileInputTrigger } from '../ui/file-input';
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
} from '../ui/number-field';

async function requestUpload({
  name,
  size,
  publicationId,
}: {
  name: string;
  size: number;
  publicationId?: string;
}) {
  'use server';
  const { sessionClaims } = auth();
  if (!hasRole('admin', sessionClaims)) {
    throw new Error('You must be an admin to access this resource.');
  }
  return await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: Resource.BibleBucket.name,
      Key: `${createId()}_${name}`,
      ContentLength: size,
      ContentType: 'application/zip',
      Metadata: publicationId ? { 'publication-id': publicationId } : undefined,
    }),
    { expiresIn: 60 * 60 * 24 },
  );
}

export const BiblesContent = () => {
  const [publicationId, setPublicationId] = createSignal<string>();
  const [files, setFiles] = createSignal<FileList>();
  const [toastId, setToastId] = createSignal<string | number>();

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

  const handleSubmit = async () => {
    const file = files()?.[0];
    if (file) {
      const url = await requestUploadMutation.mutateAsync({
        name: file.name,
        size: file.size,
        publicationId: publicationId(),
      });
      uploadFileMutation.mutate({
        url,
        file,
      });
    } else {
      toast.error('Please select a file');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Bible</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <NumberField
          class="w-52"
          minValue={1}
          maxValue={5}
          value={publicationId()?.substring(1)}
          onChange={(v) => setPublicationId(`p${v}`)}
        >
          <div class="relative">
            <NumberFieldInput placeholder="Publication ID Number" />
            <NumberFieldIncrementTrigger />
            <NumberFieldDecrementTrigger />
          </div>
        </NumberField>
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
      <CardFooter>
        <Button onClick={handleSubmit}>Upload</Button>
      </CardFooter>
    </Card>
  );
};
