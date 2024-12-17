import { db } from '@/core/database';
import { pushSubscriptions } from '@/core/database/schema';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { createEffect, createSignal, onMount } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';
import { useServiceWorker } from '../contexts/service-worker';
import { requireAuth } from '../server/auth';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from './ui/switch';

const getVapidPublicKey = GET(() => {
  'use server';
  return Promise.resolve({ publicKey: Resource.VapidPublicKey.value });
});

const subscribeToPushNotificationsAction = action(
  async (input: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) => {
    'use server';
    console.log('Subscribing to push notifications', input);
    const { user } = requireAuth();
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    });
    return { success: true };
  },
);

const unsubscribeFromPushNotificationsAction = action(async (input: { endpoint: string }) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(pushSubscriptions)
    .where(
      and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, input.endpoint)),
    );
  return { success: true };
});

export type PushNotificationToggleProps = {
  onSuccess?: () => void;
};

export function PushNotificationToggle(props: PushNotificationToggleProps) {
  const subscribeToPushNotifications = useAction(subscribeToPushNotificationsAction);
  const unsubscribeFromPushNotifications = useAction(unsubscribeFromPushNotificationsAction);

  const { registration } = useServiceWorker();

  const [isSubscribed, setIsSubscribed] = createSignal(false);
  const [isSupported, setIsSupported] = createSignal(false);

  onMount(() => {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
  });

  createEffect(async () => {
    const currentRegistration = registration();
    if (!currentRegistration) return;

    // Check if already subscribed
    try {
      const subscription = await currentRegistration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  });

  const handleSubscribeToPushNotifications = createMutation(() => ({
    mutationFn: async () => {
      const currentRegistration = registration();
      if (!currentRegistration) {
        throw new Error('No service worker registration found');
      }
      console.log('Subscribing to push notifications');

      // Get the push subscription
      let subscription = await currentRegistration.pushManager.getSubscription();
      // If not subscribed, create a new subscription
      if (!subscription) {
        console.log('No subscription found, creating a new one');
        const { publicKey } = await getVapidPublicKey();
        subscription = await currentRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
      }
      console.log('Subscription:', subscription);

      const subscriptionJson = subscription.toJSON();
      if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
        throw new Error('No endpoint or keys found in subscription');
      }
      // Send the subscription to your server
      await subscribeToPushNotifications({
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
      });
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success('Successfully subscribed to notifications');
      props.onSuccess?.();
    },
    onError: (error) => {
      console.error('Error subscribing to push notifications:', error);
      toast.error(`Failed to subscribe to notifications: ${error.message}`);
    },
  }));

  const handleUnsubscribeFromPushNotifications = createMutation(() => ({
    mutationFn: async () => {
      const currentRegistration = registration();
      if (!currentRegistration) {
        throw new Error('No service worker registration found');
      }

      const subscription = await currentRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Notify your server about the unsubscription
        await unsubscribeFromPushNotifications({
          endpoint: subscription.endpoint,
        });
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success('Successfully unsubscribed from notifications');
      props.onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to unsubscribe from notifications: ${error.message}`);
    },
  }));

  return (
    <Switch
      class='flex items-center gap-2'
      disabled={!isSupported()}
      checked={isSubscribed()}
      onChange={(v) =>
        v
          ? handleSubscribeToPushNotifications.mutate()
          : handleUnsubscribeFromPushNotifications.mutate()
      }
    >
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
      <SwitchLabel>Enable Push Notifications</SwitchLabel>
    </Switch>
  );
}
