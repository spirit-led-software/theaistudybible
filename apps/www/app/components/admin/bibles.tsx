import { s3 } from '@/core/storage';
import { createId } from '@/core/utils/id';
import { requireAdminMiddleware } from '@/www/server/middleware/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { useMutation } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { FolderArchive } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Resource } from 'sst';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import {
  FileInput,
  FileInputDropArea,
  FileInputInput,
  FileInputRoot,
  FileInputTrigger,
} from '../ui/file-input';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const requestUpload = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(
    z.object({
      name: z.string(),
      size: z.number(),
      publicationId: z.string().optional(),
      generateEmbeddings: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const metadata: Record<string, string> = {
      'generate-embeddings': data.generateEmbeddings.toString(),
    };
    if (data.publicationId) {
      metadata['publication-id'] = data.publicationId;
    }

    const presignedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: Resource.BibleBucket.name,
        Key: `${createId()}_${data.name}`,
        ContentLength: data.size,
        ContentType: 'application/zip',
        Metadata: metadata,
      }),
      { expiresIn: 60 * 60 * 24 },
    );

    return { presignedUrl };
  });

export const BiblesContent = () => {
  const [publicationId, setPublicationId] = useState<string>();
  const [generateEmbeddings, setGenerateEmbeddings] = useState(false);
  const [files, setFiles] = useState<FileList>();
  const [toastId, setToastId] = useState<string | number>();

  const requestUploadMutation = useMutation({
    mutationFn: requestUpload,
    onMutate: () => {
      setToastId(toast.loading('Uploading...', { duration: Number.POSITIVE_INFINITY }));
    },
    onError: () => {
      toast.dismiss(toastId);
      toast.error('Failed to request upload');
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ url, file }: { url: string; file: File }) => {
      await fetch(url, {
        method: 'PUT',
        body: file,
      });
    },
    onSuccess: () => {
      toast.dismiss(toastId);
      toast.success('Bible zip uploaded');
      setFiles(undefined);
    },
    onError: () => {
      toast.dismiss(toastId);
      toast.error('Failed to upload bible zip');
    },
  });

  const handleSubmit = async () => {
    const file = files?.[0];
    if (file) {
      const { presignedUrl } = await requestUploadMutation.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          publicationId: publicationId,
          generateEmbeddings: generateEmbeddings,
        },
      });
      uploadFileMutation.mutate({
        url: presignedUrl,
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
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center gap-4'>
          <Input
            className='w-52'
            value={publicationId}
            onChange={(e) => setPublicationId(e.target.value)}
            placeholder='Publication ID (e.g p1)'
          />
          <div className='flex items-center gap-1'>
            <Label>Generate embeddings</Label>
            <Checkbox
              checked={generateEmbeddings}
              onCheckedChange={(checked) =>
                setGenerateEmbeddings(typeof checked === 'boolean' ? checked : false)
              }
            />
          </div>
        </div>
        <FileInput value={files} onChange={setFiles}>
          <FileInputRoot className='h-32'>
            <FileInputTrigger className='flex h-full items-center justify-center border-2 border-gray-300 border-dashed p-4 text-lg'>
              <FolderArchive className='mr-4 size-8' />
              Choose zip
            </FileInputTrigger>
            <FileInputInput />
            <FileInputDropArea className='border-2 border-gray-300 border-dashed p-4'>
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
