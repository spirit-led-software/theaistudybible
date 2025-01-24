import { db } from '@/core/database';
import { pushSubscriptions } from '@/core/database/schema';
import { auth } from '@/www/server/auth';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import webPush from 'web-push';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TextField, TextFieldInput, TextFieldTextArea } from '../ui/text-field';

const triggerPushNotification = async (title: string, body: string, url?: string) => {
  'use server';
  webPush.setVapidDetails(
    'mailto:support@theaistudybible.com',
    Resource.VapidPublicKey.value,
    Resource.VapidPrivateKey.value,
  );

  const { roles } = auth();
  if (!roles?.some((role) => role.id === 'admin')) {
    throw new Error('You must be an admin to access this resource.');
  }

  const subscriptions = await db.query.pushSubscriptions.findMany({});
  await Promise.all(
    subscriptions.map((subscription) =>
      webPush
        .sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ title, body, url: url || '/' }),
        )
        .catch(async (error) => {
          console.error(error);
          if (error.statusCode === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
          }
        }),
    ),
  );
  return { success: true };
};

export const PushNotificationContent = () => {
  const [toastId, setToastId] = createSignal<string | number>();
  const [title, setTitle] = createSignal('');
  const [body, setBody] = createSignal('');
  const [url, setUrl] = createSignal('');

  const triggerNotificationMutation = createMutation(() => ({
    mutationFn: () => triggerPushNotification(title(), body(), url()),
    onMutate: () => {
      setToastId(toast.loading('Sending notifications...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId());
      toast.success('Notifications sent!');
      setTitle('');
      setBody('');
      setUrl('');
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Push Notification</CardTitle>
      </CardHeader>
      <CardContent class='flex flex-col gap-4'>
        <TextField value={title()} onChange={(v) => setTitle(v)}>
          <TextFieldInput type='text' placeholder='Notification Title' />
        </TextField>
        <TextField value={body()} onChange={(v) => setBody(v)}>
          <TextFieldTextArea placeholder='Notification Body' />
        </TextField>
        <TextField value={url()} onChange={(v) => setUrl(v)}>
          <TextFieldInput type='url' placeholder='URL (optional)' />
        </TextField>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => triggerNotificationMutation.mutate()}
          disabled={!title() || !body() || triggerNotificationMutation.isPending}
        >
          Send Notification
        </Button>
      </CardFooter>
    </Card>
  );
};
