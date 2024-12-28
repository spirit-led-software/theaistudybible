import { s3 } from '@/core/storage';
import { createId } from '@/core/utils/id';
import { Button } from '@/www/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
import { useAuth } from '@/www/contexts/auth';
import { requireAuth } from '@/www/server/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { action, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Pencil } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { Avatar, AvatarFallback, AvatarImage } from '../../../ui/avatar';

const requestUploadAction = action(
  async (props: { name: string; contentType: string; size: number }) => {
    'use server';
    const { user } = requireAuth();
    const key = `${user.id}/${createId()}_${props.name}`;
    const presignedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: Resource.ProfileImagesBucket.name,
        Key: key,
        ContentType: props.contentType,
        ContentLength: props.size,
        Metadata: { 'user-id': user.id },
      }),
      { expiresIn: 3600 },
    );
    return { presignedUrl, key };
  },
);

export function UpdateAvatarDialog() {
  const requestUpload = useAction(requestUploadAction);

  const { user, invalidate } = useAuth();

  const [toastId, setToastId] = createSignal<string | number>();
  const [open, setOpen] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);

  const handleUpdateAvatar = createMutation(() => ({
    mutationFn: async (file: File) => {
      const { presignedUrl } = await requestUpload({
        name: file.name,
        contentType: file.type,
        size: file.size,
      });
      const response = await fetch(presignedUrl, { method: 'PUT', body: file });
      if (!response.ok) throw new Error(`Failed to upload avatar: ${response.statusText}`);
    },
    onMutate: () =>
      setToastId(toast.loading('Updating avatar...', { duration: Number.POSITIVE_INFINITY })),
    onSuccess: () => {
      toast.dismiss(toastId());
      toast.success('Avatar updated successfully');
      setOpen(false);
      // Need to wait a few seconds for the
      // bucket function to update the user
      setTimeout(() => invalidate(), 5000);
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
  }));

  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      setSelectedFile(() => file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(() => e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const file = selectedFile();
    if (file) {
      handleUpdateAvatar.mutate(file);
    }
  };

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger as={Button} class='rounded-full bg-secondary p-1.5 hover:bg-secondary/90'>
        <Pencil class='size-6' />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <div class='flex flex-col items-center gap-4'>
          <Avatar class='size-32 border-4 border-primary/10'>
            <AvatarImage src={previewUrl() || user()?.image || undefined} />
            <AvatarFallback class='text-3xl'>
              {user()?.firstName?.charAt(0) || user()?.email?.charAt(0) || '?'}
              {user()?.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          <input
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            class='hidden'
            id='avatar-upload'
          />
          <label
            for='avatar-upload'
            class='cursor-pointer rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
          >
            Choose Image
          </label>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedFile() || handleUpdateAvatar.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
